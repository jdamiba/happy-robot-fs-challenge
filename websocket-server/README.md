# Happy Robot WebSocket Server

A standalone WebSocket server for real-time collaboration features in the Happy Robot project management application.

## Features

- 🔌 **WebSocket Support**: Real-time bidirectional communication
- 🏠 **Project Rooms**: Users can join/leave project-specific rooms
- 📡 **Message Broadcasting**: Broadcast updates to all clients in a project
- 🔄 **Auto-reconnection**: Client-side reconnection handling
- 📊 **Health Monitoring**: Health check and statistics endpoints
- 🚀 **Scalable**: Designed for independent deployment

## Supported Message Types

### Client → Server

- `SET_USER`: Set user ID for a client
- `JOIN_PROJECT`: Join a project room
- `LEAVE_PROJECT`: Leave a project room
- `TASK_CREATE`: Broadcast task creation
- `TASK_UPDATE`: Broadcast task updates
- `TASK_DELETE`: Broadcast task deletion
- `COMMENT_CREATE`: Broadcast comment creation
- `COMMENT_UPDATE`: Broadcast comment updates
- `COMMENT_DELETE`: Broadcast comment deletion
- `PROJECT_UPDATE`: Broadcast project updates

### Server → Client

- `CONNECTION_ESTABLISHED`: Welcome message with client ID
- `TASK_UPDATE`: Real-time task updates
- `TASK_CREATE`: New task notifications
- `TASK_DELETE`: Task deletion notifications
- `COMMENT_CREATE`: New comment notifications
- `COMMENT_UPDATE`: Comment update notifications
- `COMMENT_DELETE`: Comment deletion notifications
- `PROJECT_UPDATE`: Project update notifications
- `ERROR`: Error messages

## Quick Start

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment**:

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**:

   ```bash
   npm run dev  # Development with auto-reload
   # or
   npm start    # Production
   ```

4. **Server will be available at**:
   - WebSocket: `ws://localhost:3001/ws`
   - Health check: `http://localhost:3001/health`
   - Stats: `http://localhost:3001/stats`

### Environment Variables

| Variable          | Description                            | Default                 |
| ----------------- | -------------------------------------- | ----------------------- |
| `PORT`            | Server port                            | `3001`                  |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000` |
| `LOG_LEVEL`       | Logging level                          | `info`                  |
| `NODE_ENV`        | Environment                            | `development`           |

## Deployment

### Render.com

1. **Create a new Web Service** on Render
2. **Connect your repository** (this websocket-server directory)
3. **Configure build settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Set environment variables**:
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://your-nextjs-app.onrender.com`

### Docker

1. **Build the image**:

   ```bash
   docker build -t happy-robot-websocket .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3001:3001 \
     -e ALLOWED_ORIGINS=https://your-app.com \
     happy-robot-websocket
   ```

### Other Platforms

The server is compatible with any Node.js hosting platform:

- **Heroku**: Uses `render.yaml` configuration
- **Railway**: Supports Docker deployment
- **DigitalOcean App Platform**: Use Dockerfile
- **AWS ECS/Fargate**: Use Dockerfile

## API Endpoints

### Health Check

```http
GET /health
```

Returns server health status and basic stats.

### Server Statistics

```http
GET /stats
```

Returns detailed server statistics including client counts per project.

## WebSocket Connection

### Connection URL

```
ws://localhost:3001/ws
```

### Connection Flow

1. **Connect** to WebSocket endpoint
2. **Receive** `CONNECTION_ESTABLISHED` message with client ID
3. **Send** `SET_USER` message to identify user
4. **Send** `JOIN_PROJECT` to join project rooms
5. **Send/Receive** real-time messages

### Example Client Code

```javascript
const ws = new WebSocket("ws://localhost:3001/ws");

ws.onopen = () => {
  console.log("Connected to WebSocket server");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Received:", message);
};

// Join a project
ws.send(
  JSON.stringify({
    type: "JOIN_PROJECT",
    projectId: "project-123",
  })
);

// Broadcast a task update
ws.send(
  JSON.stringify({
    type: "TASK_UPDATE",
    projectId: "project-123",
    payload: {
      id: "task-456",
      title: "Updated task title",
    },
    operationId: "op-789",
  })
);
```

## Monitoring

The server provides several monitoring endpoints:

- **Health Check**: `/health` - Basic health status
- **Statistics**: `/stats` - Detailed server metrics
- **Logs**: Check application logs for connection events

## Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   Next.js App   │◄──────────────►│  WebSocket       │
│   (Frontend)    │                 │  Server          │
└─────────────────┘                 └──────────────────┘
         │                                   │
         │                                   │
    ┌────▼────┐                         ┌────▼────┐
    │  Clerk  │                         │ Project │
    │  Auth   │                         │ Rooms   │
    └─────────┘                         └─────────┘
```

## Security

- **CORS Protection**: Configurable allowed origins
- **User Authentication**: Clients must identify themselves
- **Project Isolation**: Users only receive messages from projects they've joined
- **Input Validation**: All messages are validated before processing

## Scaling

For production scaling:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Redis Adapter**: Use Redis for shared state across instances
3. **Message Queues**: Implement message queues for high-volume scenarios
4. **Monitoring**: Add comprehensive logging and metrics

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if server is running and port is correct
2. **CORS Errors**: Verify `ALLOWED_ORIGINS` includes your frontend URL
3. **Messages Not Received**: Ensure client has joined the project room
4. **High Memory Usage**: Check for memory leaks in client connections

### Debug Mode

Set `LOG_LEVEL=debug` for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
