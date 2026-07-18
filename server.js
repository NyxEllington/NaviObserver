require('dotenv').config();
const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  navidrome: {
    url: process.env.NAVIDROME_URL || 'http://localhost:4533',
    username: process.env.NAVIDROME_USERNAME,
    password: process.env.NAVIDROME_PASSWORD,
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 2000,
  }
};

// Validate configuration
if (!CONFIG.navidrome.username || !CONFIG.navidrome.password) {
  console.error('❌ ERROR: NAVIDROME_USERNAME and NAVIDROME_PASSWORD must be set in .env file');
  process.exit(1);
}

// Express app setup
const app = express();
app.use(express.static('public'));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Create HTTP server and WebSocket
const server = app.listen(CONFIG.server.port, '0.0.0.0', () => {
  console.log('\n🎵 Navidrome Overlay Server');
  console.log('━'.repeat(50));
  console.log(`📡 Server: http://localhost:${CONFIG.server.port}`);
  console.log(`📺 Overlay: http://localhost:${CONFIG.server.port}/overlay.html`);
  console.log(`🔗 Navidrome: ${CONFIG.navidrome.url}`);
  console.log('━'.repeat(50) + '\n');
});

const wss = new WebSocket.Server({ server });

// Current track state
let currentTrack = null;

// ============================================================================
// SUBSONIC API CLIENT
// ============================================================================

class SubsonicClient {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.username = username;
    this.password = password;
    this.clientName = 'NaviOverlay';
    this.apiVersion = '1.16.1';
  }

  // Generate authentication parameters for Subsonic API
  getAuthParams() {
    const salt = crypto.randomBytes(12).toString('hex');
    const token = crypto.createHash('md5')
      .update(this.password + salt)
      .digest('hex');
    
    return {
      u: this.username,
      t: token,
      s: salt,
      v: this.apiVersion,
      c: this.clientName,
      f: 'json'
    };
  }

  // Make API request
  async request(endpoint, additionalParams = {}) {
    try {
      const params = { ...this.getAuthParams(), ...additionalParams };
      const url = `${this.baseUrl}/rest/${endpoint}`;
      
      const response = await axios.get(url, { 
        params,
        timeout: 10000 
      });

      const result = response.data['subsonic-response'];
      
      if (result.status === 'ok') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error(`Subsonic API Error: ${result.error.message}`);
      }
      
      return result;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Navidrome server');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Connection to Navidrome timed out');
      }
      throw error;
    }
  }

  // Test connection
  async ping() {
    const result = await this.request('ping');
    return result.status === 'ok';
  }

  // Get now playing tracks
  async getNowPlaying() {
    try {
      const result = await this.request('getNowPlaying');
      
      if (result.nowPlaying && result.nowPlaying.entry && result.nowPlaying.entry.length > 0) {
        const entry = result.nowPlaying.entry[0];
        
        // Build cover art URL
        let coverArtUrl = null;
        if (entry.coverArt) {
          const params = new URLSearchParams({
            ...this.getAuthParams(),
            id: entry.coverArt,
            size: 500
          });
          coverArtUrl = `${this.baseUrl}/rest/getCoverArt?${params}`;
        }
        
        return {
          id: entry.id,
          title: entry.title || 'Unknown Title',
          artist: entry.artist || 'Unknown Artist',
          album: entry.album || 'Unknown Album',
          year: entry.year || null,
          genre: entry.genre || null,
          duration: entry.duration || 0,
          coverArt: coverArtUrl,
          username: entry.username,
          playerId: entry.playerId,
          minutesAgo: entry.minutesAgo || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting now playing:', error.message);
      return null;
    }
  }
}

// Initialize Subsonic client
const subsonic = new SubsonicClient(
  CONFIG.navidrome.url,
  CONFIG.navidrome.username,
  CONFIG.navidrome.password
);

// ============================================================================
// WEBSOCKET BROADCASTING
// ============================================================================

function broadcast(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });
  
  return sentCount;
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('👁️  New client connected');
  
  // Send current track immediately
  if (currentTrack) {
    ws.send(JSON.stringify({ type: 'update', track: currentTrack }));
  } else {
    ws.send(JSON.stringify({ type: 'update', track: null }));
  }
  
  ws.on('close', () => {
    console.log('👋 Client disconnected');
  });
});

// ============================================================================
// POLLING LOOP
// ============================================================================

let pollCount = 0;
let lastTrackId = null;

async function pollNowPlaying() {
  try {
    const track = await subsonic.getNowPlaying();
    
    // Check if track changed
    const trackId = track ? track.id : null;
    const hasChanged = trackId !== lastTrackId;
    
    if (hasChanged) {
      lastTrackId = trackId;
      currentTrack = track;
      
      if (track) {
        console.log(`🎵 Now Playing: ${track.artist} - ${track.title}`);
      } else {
        console.log('⏸️  Nothing playing');
      }
      
      // Broadcast to all clients
      const clientCount = broadcast({ type: 'update', track: currentTrack });
      if (clientCount > 0) {
        console.log(`   📡 Sent to ${clientCount} client(s)`);
      }
    }
    
    pollCount++;
    
  } catch (error) {
    console.error('❌ Poll error:', error.message);
  }
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

app.get('/api/now-playing', (req, res) => {
  res.json({
    track: currentTrack,
    timestamp: Date.now()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    navidrome: CONFIG.navidrome.url,
    clients: wss.clients.size,
    pollCount: pollCount,
    currentTrack: currentTrack ? true : false
  });
});

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initialize() {
  console.log('🔄 Testing connection to Navidrome...');
  
  try {
    const pingOk = await subsonic.ping();
    
    if (pingOk) {
      console.log('✅ Connected to Navidrome successfully!\n');
      
      // Do initial poll
      await pollNowPlaying();
      
      // Start polling loop
      setInterval(pollNowPlaying, CONFIG.server.updateInterval);
      
    } else {
      console.error('❌ Failed to connect to Navidrome\n');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('⚠️  Will keep trying to reconnect...\n');
    
    // Keep polling anyway, will reconnect when available
    setInterval(pollNowPlaying, CONFIG.server.updateInterval);
  }
}

// Start the application
initialize();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  wss.clients.forEach(client => client.close());
  server.close(() => {
    console.log('👋 Goodbye!');
    process.exit(0);
  });
});
