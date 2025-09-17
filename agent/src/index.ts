import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { 
  startProgram, 
  stopProgram, 
  restartPC, 
  disconnectInternet, 
  reconnectInternet,
  getSystemStatus 
} from './commands';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// HTTP Server for WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Controller connected via WebSocket');
  
  ws.on('message', (data: any) => {
    console.log('Received:', data.toString());
  });
  
  ws.on('close', () => {
    console.log('Controller disconnected');
  });
  
  // Send initial status
  ws.send(JSON.stringify({ type: 'status', data: getSystemStatus() }));
});

// Broadcast to all connected clients
const broadcast = (message: any) => {
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// API Routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get system status
app.get('/status', (req: Request, res: Response) => {
  try {
    const status = getSystemStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start a program
app.post('/start', async (req: Request, res: Response) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ success: false, error: 'Program path is required' });
    }
    
    const result = await startProgram(path);
    broadcast({ type: 'log', message: `Started program: ${path}` });
    res.json({ success: true, data: result });
  } catch (error: any) {
    broadcast({ type: 'error', message: `Failed to start program: ${error.message}` });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop a program
app.post('/stop', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Program name is required' });
    }
    
    const result = await stopProgram(name);
    broadcast({ type: 'log', message: `Stopped program: ${name}` });
    res.json({ success: true, data: result });
  } catch (error: any) {
    broadcast({ type: 'error', message: `Failed to stop program: ${error.message}` });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restart PC
app.post('/restart', async (req: Request, res: Response) => {
  try {
    broadcast({ type: 'log', message: 'Restarting PC...' });
    res.json({ success: true, message: 'Restart command sent' });
    
    // Delay restart to send response first
    setTimeout(async () => {
      await restartPC();
    }, 1000);
  } catch (error: any) {
    broadcast({ type: 'error', message: `Failed to restart PC: ${error.message}` });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect internet
app.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const result = await disconnectInternet();
    broadcast({ type: 'log', message: 'Internet disconnected' });
    res.json({ success: true, data: result });
  } catch (error: any) {
    broadcast({ type: 'error', message: `Failed to disconnect internet: ${error.message}` });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reconnect internet
app.post('/reconnect', async (req: Request, res: Response) => {
  try {
    const result = await reconnectInternet();
    broadcast({ type: 'log', message: 'Internet reconnected' });
    res.json({ success: true, data: result });
  } catch (error: any) {
    broadcast({ type: 'error', message: `Failed to reconnect internet: ${error.message}` });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Windows Management Agent running on port ${PORT}`);
  console.log(`HTTP API: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Agent shutting down...');
  server.close(() => {
    process.exit(0);
  });
});