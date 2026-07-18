require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const CONFIG = {
  url: process.env.NAVIDROME_URL,
  username: process.env.NAVIDROME_USERNAME,
  password: process.env.NAVIDROME_PASSWORD
};

console.log('\n🧪 Navidrome Subsonic API Test');
console.log('━'.repeat(60));
console.log(`URL:      ${CONFIG.url}`);
console.log(`Username: ${CONFIG.username}`);
console.log(`Password: ${'*'.repeat(CONFIG.password?.length || 0)}`);
console.log('━'.repeat(60) + '\n');

function getAuthParams() {
  const salt = crypto.randomBytes(12).toString('hex');
  const token = crypto.createHash('md5')
    .update(CONFIG.password + salt)
    .digest('hex');
  
  return {
    u: CONFIG.username,
    t: token,
    s: salt,
    v: '1.16.1',
    c: 'NaviTest',
    f: 'json'
  };
}

async function test() {
  try {
    // Test 1: Ping
    console.log('1️⃣  Testing ping endpoint...');
    const pingParams = getAuthParams();
    const pingUrl = `${CONFIG.url}/rest/ping`;
    
    const pingResponse = await axios.get(pingUrl, { params: pingParams, timeout: 5000 });
    const pingResult = pingResponse.data['subsonic-response'];
    
    if (pingResult.status === 'ok') {
      console.log('   ✅ Ping successful');
      console.log(`   Version: ${pingResult.version}`);
      console.log(`   Type: ${pingResult.type || 'Subsonic'}\n`);
    } else {
      console.log('   ❌ Ping failed:', pingResult.error?.message);
      return;
    }

    // Test 2: Get Now Playing
    console.log('2️⃣  Testing getNowPlaying endpoint...');
    const nowParams = getAuthParams();
    const nowUrl = `${CONFIG.url}/rest/getNowPlaying`;
    
    const nowResponse = await axios.get(nowUrl, { params: nowParams, timeout: 5000 });
    const nowResult = nowResponse.data['subsonic-response'];
    
    if (nowResult.status === 'ok') {
      console.log('   ✅ getNowPlaying successful\n');
      
      if (nowResult.nowPlaying?.entry && nowResult.nowPlaying.entry.length > 0) {
        const track = nowResult.nowPlaying.entry[0];
        
        console.log('   📀 Currently Playing:');
        console.log('   ━'.repeat(30));
        console.log(`   🎵 Title:    ${track.title}`);
        console.log(`   👤 Artist:   ${track.artist}`);
        console.log(`   💿 Album:    ${track.album}`);
        console.log(`   📅 Year:     ${track.year || 'N/A'}`);
        console.log(`   🎭 Genre:    ${track.genre || 'N/A'}`);
        console.log(`   ⏱️  Duration: ${track.duration || 0}s`);
        console.log(`   🆔 ID:       ${track.id}`);
        console.log(`   🖼️  CoverArt: ${track.coverArt || 'N/A'}`);
        console.log(`   👤 User:     ${track.username}`);
        console.log('   ━'.repeat(30));
        
        // Test 3: Get Cover Art
        if (track.coverArt) {
          console.log('\n3️⃣  Testing getCoverArt endpoint...');
          const coverParams = getAuthParams();
          coverParams.id = track.coverArt;
          coverParams.size = 300;
          const coverUrl = `${CONFIG.url}/rest/getCoverArt`;
          
          try {
            const coverResponse = await axios.head(coverUrl, { params: coverParams, timeout: 5000 });
            console.log(`   ✅ Cover art accessible (${coverResponse.headers['content-type']})`);
            console.log(`   📐 Size: ${coverResponse.headers['content-length']} bytes`);
            
            // Build full URL for display
            const fullCoverUrl = `${coverUrl}?${new URLSearchParams(coverParams)}`;
            console.log(`   🔗 URL: ${fullCoverUrl.substring(0, 80)}...`);
          } catch (error) {
            console.log('   ⚠️  Cover art not accessible:', error.message);
          }
        }
        
      } else {
        console.log('   ℹ️  No tracks currently playing');
        console.log('   💡 Start playing music in Navidrome to test');
      }
    } else {
      console.log('   ❌ getNowPlaying failed:', nowResult.error?.message);
      return;
    }

    console.log('\n' + '━'.repeat(60));
    console.log('✅ All tests passed!');
    console.log('━'.repeat(60));
    console.log('\n🚀 You can now run: npm start\n');

  } catch (error) {
    console.log('\n❌ Test failed!\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   Connection refused');
      console.log(`   → Is Navidrome running at ${CONFIG.url}?`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   Connection timed out');
      console.log('   → Check if the URL is correct and accessible');
    } else if (error.response) {
      console.log(`   HTTP ${error.response.status}: ${error.response.statusText}`);
      const subsonicError = error.response.data?.['subsonic-response']?.error;
      if (subsonicError) {
        console.log(`   → ${subsonicError.message} (code: ${subsonicError.code})`);
      }
    } else {
      console.log(`   ${error.message}`);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your .env file has correct values');
    console.log('   2. Ensure Navidrome is running');
    console.log(`   3. Try opening ${CONFIG.url} in your browser`);
    console.log('   4. Verify username and password are correct\n');
    
    process.exit(1);
  }
}

test();
