# Deploy NaviObserver with Dockge

This guide shows you how to deploy NaviObserver using [Dockge](https://github.com/louislam/dockge) - a fancy, easy-to-use Docker Compose manager.

## Quick Deploy

### Option 1: Using Dockge UI (Recommended)

1. **Open your Dockge dashboard** (usually at `http://your-server:5001`)

2. **Click "Compose" → "Create"**

3. **Enter Stack Name:** `naviobserver`

4. **Paste this docker-compose content:**

```yaml
version: '3.8'

services:
  naviobserver:
    build:
      context: https://github.com/NyxEllington/NaviObserver.git
      dockerfile: Dockerfile
    container_name: naviobserver
    ports:
      - "3000:3000"
    environment:
      NAVIDROME_URL: ${NAVIDROME_URL:-http://host.docker.internal:4533}
      NAVIDROME_USERNAME: ${NAVIDROME_USERNAME}
      NAVIDROME_PASSWORD: ${NAVIDROME_PASSWORD}
      PORT: ${PORT:-3000}
      UPDATE_INTERVAL: ${UPDATE_INTERVAL:-2000}
    restart: unless-stopped
```

5. **Set environment variables in Dockge:**
   - Click on the **"Environment Variables"** tab or section
   - Add these variables:
     - `NAVIDROME_URL` = Your Navidrome server URL (e.g., `http://192.168.1.100:4533`)
     - `NAVIDROME_USERNAME` = Your Navidrome username
     - `NAVIDROME_PASSWORD` = Your Navidrome password
   - Optional variables (have defaults):
     - `PORT` = Server port (default: `3000`)
     - `UPDATE_INTERVAL` = Polling interval in ms (default: `2000`)

6. **Click "Deploy"**

7. **Access the overlay at:** `http://your-server:3000/overlay.html`

### Option 2: Using Existing Compose File

If you've cloned the repository:

1. Copy the Dockge-specific compose file:
   ```bash
   cp docker-compose.dockge.yml docker-compose.yml
   ```

2. Edit the environment variables in `docker-compose.yml`

3. Import the stack in Dockge or deploy directly:
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NAVIDROME_URL` | Your Navidrome server URL | `http://192.168.1.100:4533` |
| `NAVIDROME_USERNAME` | Navidrome username | `admin` |
| `NAVIDROME_PASSWORD` | Navidrome password | `your_password` |
| `PORT` | Port for overlay server | `3000` |
| `UPDATE_INTERVAL` | Polling interval (ms) | `2000` |

### Navidrome URL Examples

**Same machine as Dockge:**
- Windows/Mac: `http://host.docker.internal:4533`
- Linux: `http://172.17.0.1:4533`

**Different machine:**
- Local IP: `http://192.168.1.100:4533`
- Domain: `https://music.yourdomain.com`

**Navidrome also in Docker:**
- Same Docker network: `http://navidrome:4533`

## Using the Overlay

Once deployed, access the overlay at:
```
http://your-server:3000/overlay.html
```

### For OBS Studio:

1. Add a **Browser Source**
2. URL: `http://your-server:3000/overlay.html`
3. Width: `1920`
4. Height: `1080`
5. ✅ Check "Shutdown source when not visible"
6. ✅ Check "Refresh browser when scene becomes active"

## Managing with Dockge

### View Logs
Click on your stack → "Logs" tab

### Restart Container
Click "Restart" button

### Update to Latest Version
Click "Rebuild" button to pull and rebuild from latest GitHub code

### Stop/Start
Use the power button to start/stop the stack

## Troubleshooting

### Can't Connect to Navidrome

**Check from inside the container:**
```bash
docker exec naviobserver wget -O- http://your-navidrome-url
```

**Verify environment variables:**
```bash
docker exec naviobserver env | grep NAVIDROME
```

### Overlay Shows "Waiting for track..."

1. Make sure Navidrome is playing a song
2. Check credentials are correct
3. Verify NAVIDROME_URL is accessible from container
4. Check logs in Dockge for error messages

### Port Already in Use

Change the port in the compose file:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

## Advanced Configuration

### Using Docker Network with Navidrome

If your Navidrome is also in Docker and you want them to communicate:

```yaml
version: '3.8'

services:
  naviobserver:
    build:
      context: https://github.com/NyxEllington/NaviObserver.git
      dockerfile: Dockerfile
    container_name: naviobserver
    ports:
      - "3000:3000"
    environment:
      NAVIDROME_URL: http://navidrome:4533  # Use container name
      NAVIDROME_USERNAME: your_username
      NAVIDROME_PASSWORD: your_password
      PORT: 3000
      UPDATE_INTERVAL: 2000
    restart: unless-stopped
    networks:
      - navidrome-network

networks:
  navidrome-network:
    external: true  # If Navidrome network already exists
    # or
    # driver: bridge  # If creating a new network
```

### Resource Limits

Add resource limits to prevent excessive resource usage:

```yaml
services:
  naviobserver:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

## Updates

To update to the latest version:

1. In Dockge, click your stack
2. Click "Rebuild" button
3. Dockge will pull the latest code from GitHub and rebuild

Or manually:
```bash
docker-compose pull
docker-compose up -d
```

## Support

- GitHub Issues: https://github.com/NyxEllington/NaviObserver/issues
- Discussions: https://github.com/NyxEllington/NaviObserver/discussions
