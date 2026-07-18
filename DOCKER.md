# Docker Deployment Guide

This guide explains how to deploy NaviObserver using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)
- A running Navidrome server

## Quick Start with Docker Compose

1. **Create a `.env` file** from the example:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your Navidrome credentials:
   ```env
   NAVIDROME_URL=http://your-navidrome-server:4533
   NAVIDROME_USERNAME=your_username
   NAVIDROME_PASSWORD=your_password
   PORT=3000
   UPDATE_INTERVAL=2000
   ```

3. **Start the container**:
   ```bash
   docker-compose up -d
   ```

4. **Access the overlay** at:
   ```
   http://localhost:3000/overlay.html
   ```

5. **View logs**:
   ```bash
   docker-compose logs -f
   ```

6. **Stop the container**:
   ```bash
   docker-compose down
   ```

## Manual Docker Build & Run

If you prefer not to use Docker Compose:

1. **Build the image**:
   ```bash
   docker build -t naviobserver .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name naviobserver \
     -p 3000:3000 \
     -e NAVIDROME_URL=http://your-navidrome-server:4533 \
     -e NAVIDROME_USERNAME=your_username \
     -e NAVIDROME_PASSWORD=your_password \
     -e PORT=3000 \
     -e UPDATE_INTERVAL=2000 \
     naviobserver
   ```

3. **Access the overlay** at:
   ```
   http://localhost:3000/overlay.html
   ```

## Connecting to Navidrome

### Navidrome on the Same Machine

- **Windows/Mac**: Use `http://host.docker.internal:4533`
- **Linux**: Use `http://172.17.0.1:4533` or your host's IP address

### Navidrome on Different Machine

Use the IP address or hostname:
```env
NAVIDROME_URL=http://192.168.1.100:4533
```

### Navidrome with Domain

```env
NAVIDROME_URL=https://music.yourdomain.com
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NAVIDROME_URL` | URL to your Navidrome server | `http://localhost:4533` |
| `NAVIDROME_USERNAME` | Your Navidrome username | *Required* |
| `NAVIDROME_PASSWORD` | Your Navidrome password | *Required* |
| `PORT` | Port for the overlay server | `3000` |
| `UPDATE_INTERVAL` | Polling interval in milliseconds | `2000` |

## Updating the Container

### With Docker Compose

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Manual

```bash
docker stop naviobserver
docker rm naviobserver
docker build -t naviobserver .
docker run -d --name naviobserver -p 3000:3000 ... naviobserver
```

## Troubleshooting

### Can't connect to Navidrome

1. **Check if Navidrome is accessible** from inside the container:
   ```bash
   docker exec naviobserver wget -O- http://your-navidrome-url
   ```

2. **Verify environment variables**:
   ```bash
   docker exec naviobserver env | grep NAVIDROME
   ```

3. **Check logs**:
   ```bash
   docker logs naviobserver
   ```

### Port already in use

Change the port mapping in `docker-compose.yml` or the `-p` flag:
```yaml
ports:
  - "3001:3000"  # Access on port 3001 instead
```

## Production Deployment

For production deployment, consider:

1. **Use a reverse proxy** (nginx, Traefik) for HTTPS
2. **Set resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 256M
   ```
3. **Use Docker secrets** for sensitive credentials instead of environment variables
4. **Enable health checks**:
   ```yaml
   healthcheck:
     test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

## Building for Different Platforms

To build for multiple architectures (e.g., ARM for Raspberry Pi):

```bash
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t naviobserver .
```
