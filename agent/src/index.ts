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
  getSystemStatus,
  getNetworkConnectionDetails,
  getPCIdentification,
  startProgramSmart,
  findProgramPath
} from './commands';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for network access

// Middleware - Allow connections from controller PC
app.use(cors({
  origin: '*', // In production, specify controller PC IP
  credentials: true
}));
app.use(express.json());

// HTTP Server for WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('🔗 MdsWinShepherd Controller connected via WebSocket');
  
  ws.on('message', (data: any) => {
    console.log('Received:', data.toString());
  });
  
  ws.on('close', () => {
    console.log('📡 MdsWinShepherd Controller disconnected');
  });
  
  // Send initial status with PC identification
  const systemStatus = getSystemStatus();
  const pcInfo = getPCIdentification();
  ws.send(JSON.stringify({ 
    type: 'status', 
    data: systemStatus,
    pcInfo: pcInfo
  }));
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
  res.json({ 
    service: 'MdsWinShepherd Agent',
    version: '1.0.0',
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Get PC identification info
app.get('/pc-info', (req: Request, res: Response) => {
  try {
    const pcInfo = getPCIdentification();
    res.json({ success: true, data: pcInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
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
    
    // Try smart program detection first
    const result = await startProgramSmart(path);
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
    console.error('Error disconnecting internet:', error);
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
    console.error('Error reconnecting internet:', error);
    broadcast({ type: 'error', message: `Failed to reconnect internet: ${error.message}` });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get network details
app.get('/network', async (req: Request, res: Response) => {
  try {
    const { getNetworkConnectionDetails } = await import('./commands');
    const networkDetails = await getNetworkConnectionDetails();
    res.json({ success: true, data: networkDetails });
  } catch (error: any) {
    console.error('Error getting network details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Find program path
app.post('/find-program', async (req: Request, res: Response) => {
  try {
    const { programName } = req.body;
    if (!programName) {
      return res.status(400).json({ success: false, error: 'Program name is required' });
    }
    
    const foundPath = await findProgramPath(programName);
    if (foundPath) {
      res.json({ success: true, data: { programName, path: foundPath, found: true } });
    } else {
      res.json({ success: true, data: { programName, path: null, found: false } });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to get local IP address
async function getLocalIPAddress(): Promise<string> {
  try {
    // Method 1: Use os.networkInterfaces() (most reliable cross-platform)
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Look for IPv4, non-internal interfaces
        if (iface.family === 'IPv4' && !iface.internal && iface.address !== '127.0.0.1') {
          // Skip local link addresses (169.254.x.x)
          if (!iface.address.startsWith('169.254')) {
            return iface.address;
          }
        }
      }
    }
    
    // Method 2: Use PowerShell (Windows only)
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout: psOutput } = await execAsync('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike \'127.*\' -and $_.IPAddress -notlike \'169.254.*\'}).IPAddress | Select-Object -First 1"');
      const ip = psOutput.trim();
      if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return ip;
      }
    } catch (psError) {
      // PowerShell failed, but we already tried os.networkInterfaces()
    }
    
    // Method 3: Try Windows ipconfig if available
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('ipconfig');
      const ipMatches = stdout.match(/IPv4 Address[.\s]*:\s*(\d+\.\d+\.\d+\.\d+)/g);
      
      if (ipMatches) {
        for (const match of ipMatches) {
          const ip = match.match(/(\d+\.\d+\.\d+\.\d+)/)?.[1];
          if (ip && !ip.startsWith('127.') && !ip.startsWith('169.254')) {
            return ip;
          }
        }
      }
    } catch (ipconfigError) {
      // ipconfig not available (e.g., in Git Bash)
    }
    
    return 'Unknown-CheckManually';
  } catch (error) {
    console.error('Failed to get local IP:', error);
    return 'Unknown-Error';
  }
}

// Start server
server.listen(Number(PORT), HOST, async () => {
  const pcInfo = getPCIdentification();
  const localIP = await getLocalIPAddress();
  
  console.log(`🐑 MdsWinShepherd Agent running on ${HOST}:${PORT}`);
  console.log(`💻 PC Name: ${pcInfo.pcName}`);
  console.log(`🆔 Agent ID: ${pcInfo.agentId}`);
  console.log(`🌐 Local IP: ${localIP}`);
  console.log(`📡 Network Access: http://${localIP}:${PORT}`);
  console.log(`⚡ WebSocket: ws://${localIP}:${PORT}`);
  console.log(`📊 Connect from Controller at: http://${localIP}:${PORT}`);
  console.log(`🔒 Firewall: Ensure port ${PORT} is open for network access`);
  console.log(`📋 Add this IP to your controller: ${localIP}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Agent shutting down...');
  server.close(() => {
    process.exit(0);
  });
});