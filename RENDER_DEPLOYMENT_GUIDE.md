# Deploying WebSocket Server on Render

This guide walks you through deploying the Happy Robot WebSocket server on Render.com step by step.

## Prerequisites

- **Render.com account** (free tier available)
- **GitHub repository** with your code
- **Domain name** (optional, Render provides free subdomains)

## Step 1: Prepare Your Repository

### 1.1 Ensure WebSocket Server is Ready

Make sure your `websocket-server` directory contains:

```bash
websocket-server/
├── src/
│   └── server.js          # Main server file
├── package.json           # Dependencies
├── env.example           # Environment template
├── render.yaml           # Render configuration (optional)
└── Dockerfile            # Docker configuration (optional)
```

### 1.2 Verify Package.json

Your `websocket-server/package.json` should look like this:

```json
{
  "name": "happy-robot-websocket-server",
  "version": "1.0.0",
  "description": "Standalone WebSocket server for real-time collaboration",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Step 2: Create Render Web Service

### 2.1 Log into Render Dashboard

1. Go to [render.com](https://render.com)
2. Sign in with your GitHub account
3. Click **"New +"** in the dashboard
4. Select **"Web Service"**

### 2.2 Connect Repository

1. **Connect your GitHub repository**:

   - Click "Connect account" if not already connected
   - Select your repository from the list
   - Choose the repository containing your WebSocket server

2. **Configure the service**:
   ```
   Name: happy-robot-websocket
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

### 2.3 Advanced Settings

Click **"Advanced"** to configure additional settings:

#### Root Directory

```
Root Directory: websocket-server
```

_This tells Render to look in the `websocket-server` folder for your code._

#### Environment Variables

Add these environment variables:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-nextjs-app.onrender.com
LOG_LEVEL=info
PORT=3001
```

_Note: Render automatically sets the PORT environment variable, but we include it for clarity._

## Step 3: Deploy the Service

### 3.1 Create Web Service

1. Click **"Create Web Service"**
2. Render will start building and deploying your service
3. You'll see the build logs in real-time

### 3.2 Monitor Deployment

Watch the build process:

```
Building...
Installing dependencies...
npm install

Building application...
Starting application...
🚀 WebSocket server running on port 3001
```

### 3.3 Get Your Service URL

Once deployed, Render will provide:

- **Service URL**: `https://happy-robot-websocket.onrender.com`
- **WebSocket URL**: `wss://happy-robot-websocket.onrender.com/ws`

## Step 4: Configure Environment Variables

### 4.1 Update Render Environment Variables

In your Render dashboard:

1. Go to your WebSocket service
2. Click **"Environment"** tab
3. Add/update these variables:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-nextjs-app.onrender.com,https://your-domain.com
LOG_LEVEL=info
```

### 4.2 CORS Configuration

Make sure `ALLOWED_ORIGINS` includes:

- Your Next.js app URL (when deployed)
- Any custom domains you plan to use
- `http://localhost:3000` for local development (optional)

## Step 5: Test Your Deployment

### 5.1 Health Check

Test that your WebSocket server is running:

```bash
curl https://happy-robot-websocket.onrender.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": 1703123456789,
  "clients": 0,
  "projects": 0,
  "uptime": 123.45
}
```

### 5.2 Server Stats

Check server statistics:

```bash
curl https://happy-robot-websocket.onrender.com/stats
```

Expected response:

```json
{
  "totalClients": 0,
  "totalProjects": 0,
  "projectStats": {}
}
```

### 5.3 Test WebSocket Connection

You can test the WebSocket connection using a tool like `wscat`:

```bash
# Install wscat globally
npm install -g wscat

# Test WebSocket connection
wscat -c wss://happy-robot-websocket.onrender.com/ws
```

Expected output:

```
Connected (press CTRL+C to quit)
> {"type":"CONNECTION_ESTABLISHED","clientId":"client_123","timestamp":1703123456789}
```

### 5.4 Test Broadcast Endpoint

Test the HTTP broadcast endpoint:

```bash
curl -X POST https://happy-robot-websocket.onrender.com/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEST",
    "projectId": "test-project-123",
    "payload": {
      "message": "Hello from production!"
    },
    "operationId": "test-op-001"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Broadcast sent",
  "projectId": "test-project-123",
  "clientCount": 0
}
```

## Step 6: Update Your Next.js App

### 6.1 Environment Variables

Update your Next.js app's environment variables:

#### For Local Development (.env.local)

```env
NEXT_PUBLIC_WS_URL=wss://happy-robot-websocket.onrender.com/ws
WEBSOCKET_SERVER_URL=https://happy-robot-websocket.onrender.com
```

#### For Production (Render Dashboard)

```env
NEXT_PUBLIC_WS_URL=wss://happy-robot-websocket.onrender.com/ws
WEBSOCKET_SERVER_URL=https://happy-robot-websocket.onrender.com
```

### 6.2 Deploy Next.js App

Deploy your Next.js app to Render with the updated environment variables.

## Step 7: Render-Specific Considerations

### 7.1 Free Plan Limitations

#### Sleep Mode

- **Free services sleep** after 15 minutes of inactivity
- **Cold start time**: ~30 seconds to wake up
- **WebSocket connections**: Lost when service sleeps

#### Solutions for Free Plan

1. **Keep-alive requests**: Send periodic health checks
2. **Paid plan upgrade**: Eliminates sleep mode
3. **Client-side reconnection**: Automatic reconnection on wake-up

### 7.2 Keep-Alive Configuration

Add a keep-alive mechanism to prevent sleep:

```javascript
// In your WebSocket server (src/server.js)
setInterval(() => {
  // Send a simple request to keep the service alive
  fetch("https://happy-robot-websocket.onrender.com/health").catch(() => {}); // Ignore errors
}, 10 * 60 * 1000); // Every 10 minutes
```

### 7.3 Paid Plan Benefits

Consider upgrading to a paid plan for:

- **Always-on service** (no sleep mode)
- **Higher connection limits**
- **Better performance**
- **Custom domains**

## Step 8: Monitoring and Logs

### 8.1 View Logs

In your Render dashboard:

1. Go to your WebSocket service
2. Click **"Logs"** tab
3. Monitor real-time logs

Key log messages to look for:

```
🚀 WebSocket server running on port 3001
New WebSocket connection: client_123
Client client_123 joined project project_456
Broadcasted to 2 clients in project project_456
```

### 8.2 Health Monitoring

Set up monitoring for your WebSocket server:

```bash
# Create a simple monitoring script
#!/bin/bash
while true; do
  if ! curl -s https://happy-robot-websocket.onrender.com/health > /dev/null; then
    echo "WebSocket server is down!"
    # Send alert (email, Slack, etc.)
  fi
  sleep 60
done
```

## Step 9: Scaling Considerations

### 9.1 Single Instance Limitations

The current WebSocket server runs on a single instance, which means:

- **All clients connect** to the same server
- **Memory usage** grows with connected clients
- **No horizontal scaling** without additional setup

### 9.2 Future Scaling Options

For high-traffic applications, consider:

#### Redis Integration

```javascript
// Add Redis for shared state across instances
const Redis = require("redis");
const client = Redis.createClient(process.env.REDIS_URL);
```

#### Load Balancer Configuration

```yaml
# Multiple WebSocket server instances
# with sticky sessions for WebSocket connections
```

## Step 10: Troubleshooting

### 10.1 Common Issues

#### Build Failures

```bash
# Check build logs in Render dashboard
# Common issues:
# - Missing dependencies in package.json
# - Incorrect start command
# - Wrong root directory
```

#### Connection Issues

```bash
# Test WebSocket connection
wscat -c wss://happy-robot-websocket.onrender.com/ws

# Check CORS configuration
curl -H "Origin: https://your-app.onrender.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://happy-robot-websocket.onrender.com/broadcast
```

#### Environment Variables

```bash
# Verify environment variables in Render dashboard
# Check that ALLOWED_ORIGINS includes your domain
```

### 10.2 Debug Commands

```bash
# Test health endpoint
curl https://happy-robot-websocket.onrender.com/health

# Test stats endpoint
curl https://happy-robot-websocket.onrender.com/stats

# Test broadcast endpoint
curl -X POST https://happy-robot-websocket.onrender.com/broadcast \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","projectId":"test","payload":{"msg":"hello"}}'
```

## Step 11: Production Checklist

### 11.1 Pre-Deployment

- [ ] **Repository pushed** to GitHub
- [ ] **Package.json** configured correctly
- [ ] **Environment variables** planned
- [ ] **CORS origins** identified

### 11.2 Deployment

- [ ] **WebSocket service created** on Render
- [ ] **Build successful** (check logs)
- [ ] **Health endpoint** responding
- [ ] **WebSocket connection** working

### 11.3 Post-Deployment

- [ ] **Environment variables** set correctly
- [ ] **CORS configured** for your domains
- [ ] **Next.js app updated** with WebSocket URL
- [ ] **Real-time features** tested end-to-end

### 11.4 Monitoring

- [ ] **Logs monitoring** set up
- [ ] **Health checks** automated
- [ ] **Performance monitoring** configured
- [ ] **Alert system** in place

## Step 12: Cost Optimization

### 12.1 Free Plan Usage

- **Monitor usage** to stay within limits
- **Optimize connection handling** to reduce resource usage
- **Use keep-alive** to prevent unnecessary wake-ups

### 12.2 Paid Plan Considerations

- **Upgrade when** you need always-on service
- **Monitor costs** vs. benefits
- **Consider alternatives** like Railway or DigitalOcean

## Summary

You've successfully deployed your WebSocket server on Render! The key steps were:

1. ✅ **Prepared repository** with proper structure
2. ✅ **Created Render web service** with correct configuration
3. ✅ **Set environment variables** for production
4. ✅ **Tested deployment** with health checks
5. ✅ **Updated Next.js app** with WebSocket URL
6. ✅ **Configured monitoring** and troubleshooting

Your WebSocket server is now running at:

- **HTTP**: `https://happy-robot-websocket.onrender.com`
- **WebSocket**: `wss://happy-robot-websocket.onrender.com/ws`

The server will handle real-time communication for your Happy Robot application, enabling seamless collaboration across all connected clients!
