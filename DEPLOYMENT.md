# Happy Robot Deployment Guide

This guide covers deploying both the Next.js application and the standalone WebSocket server.

## Architecture Overview

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Next.js App   │◄─────────────►│   Database      │
│   (Frontend)    │                │   (SQLite)      │
└─────────────────┘                └─────────────────┘
         │
         │ WebSocket
         ▼
┌─────────────────┐
│ WebSocket Server│
│ (Standalone)    │
└─────────────────┘
```

## Deployment Options

### Option 1: Render.com (Recommended)

#### Deploy Next.js App

1. **Create a new Web Service** on Render
2. **Connect your repository**
3. **Configure settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. **Set environment variables**:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=file:./prod.db
   NEXT_PUBLIC_WS_URL=wss://your-websocket-server.onrender.com/ws
   WEBSOCKET_SERVER_URL=https://your-websocket-server.onrender.com
   NODE_ENV=production
   ```

#### Deploy WebSocket Server

1. **Create a separate Web Service** on Render
2. **Connect to the same repository**
3. **Set Root Directory**: `websocket-server`
4. **Configure settings**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
5. **Set environment variables**:
   ```
   PORT=3001
   ALLOWED_ORIGINS=https://your-nextjs-app.onrender.com
   NODE_ENV=production
   ```

### Option 2: Docker Deployment

#### Next.js App Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_WS_URL=ws://websocket:3001/ws
      - WEBSOCKET_SERVER_URL=http://websocket:3001
    depends_on:
      - websocket

  websocket:
    build: ./websocket-server
    ports:
      - "3001:3001"
    environment:
      - ALLOWED_ORIGINS=http://localhost:3000

  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=happyrobot
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Option 3: Vercel + Railway

#### Deploy Next.js on Vercel

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push

#### Deploy WebSocket Server on Railway

1. **Connect repository** to Railway
2. **Set Root Directory** to `websocket-server`
3. **Configure environment variables**
4. **Deploy**

## Environment Configuration

### Next.js App Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=file:./prod.db

# WebSocket Server
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com/ws
WEBSOCKET_SERVER_URL=https://your-websocket-server.com

# Environment
NODE_ENV=production
```

### WebSocket Server Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://your-nextjs-app.com

# Optional: Logging
LOG_LEVEL=info
```

## Database Setup

### SQLite (Development)

- Uses local file: `./dev.db`
- No additional setup required

### PostgreSQL (Production)

1. **Create database** on your hosting platform
2. **Update DATABASE_URL**:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```
3. **Run migrations**:
   ```bash
   npx prisma db push
   ```

## Testing Deployment

### 1. Health Checks

#### Next.js App

```bash
curl https://your-app.com/api/health
```

#### WebSocket Server

```bash
curl https://your-websocket-server.com/health
```

### 2. WebSocket Connection Test

```javascript
const ws = new WebSocket("wss://your-websocket-server.com/ws");
ws.onopen = () => console.log("Connected!");
ws.onmessage = (event) => console.log("Message:", event.data);
```

### 3. Real-time Features Test

1. **Open app** in multiple browser tabs
2. **Create a project** in one tab
3. **Verify project appears** in other tabs
4. **Create/edit/delete tasks** and verify real-time updates
5. **Test comments** for real-time collaboration

## Monitoring

### WebSocket Server Monitoring

#### Health Endpoint

```http
GET /health
```

Returns server status and basic metrics.

#### Statistics Endpoint

```http
GET /stats
```

Returns detailed server statistics.

### Application Monitoring

- **Render**: Built-in monitoring dashboard
- **Vercel**: Analytics and performance monitoring
- **Railway**: Resource usage and logs

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use a load balancer for multiple WebSocket server instances
2. **Redis**: Implement Redis for shared state across instances
3. **Message Queues**: Use Redis Pub/Sub or similar for message distribution

### Performance Optimization

1. **Connection Limits**: Monitor and set appropriate connection limits
2. **Message Throttling**: Implement rate limiting for message sending
3. **Resource Monitoring**: Monitor CPU and memory usage

## Security

### CORS Configuration

- Set `ALLOWED_ORIGINS` to your production domains only
- Never use wildcard (`*`) in production

### Authentication

- Ensure Clerk authentication is properly configured
- Validate user permissions on WebSocket connections

### Rate Limiting

- Implement rate limiting on WebSocket connections
- Monitor for abuse patterns

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**

   - Check CORS configuration
   - Verify WebSocket server is running
   - Check firewall settings

2. **Real-time Updates Not Working**

   - Verify WebSocket connection is established
   - Check browser console for errors
   - Ensure project rooms are joined correctly

3. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database server status
   - Ensure proper network connectivity

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

### Logs

- **Render**: Check service logs in dashboard
- **Vercel**: Check function logs
- **Railway**: Check deployment logs

## Backup and Recovery

### Database Backup

```bash
# SQLite
cp prod.db prod.db.backup

# PostgreSQL
pg_dump $DATABASE_URL > backup.sql
```

### Configuration Backup

- Store environment variables securely
- Document deployment procedures
- Maintain deployment scripts

## Updates and Maintenance

### Updating the Application

1. **Test changes** in development
2. **Deploy to staging** environment
3. **Run integration tests**
4. **Deploy to production**

### WebSocket Server Updates

1. **Update server code**
2. **Restart WebSocket service**
3. **Verify connections** are re-established
4. **Monitor for issues**

## Support

For deployment issues:

1. Check service logs
2. Verify environment variables
3. Test individual components
4. Check network connectivity
5. Review security settings
