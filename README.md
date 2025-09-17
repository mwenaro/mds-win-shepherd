# 🐑 MdsWinShepherd

**A comprehensive Windows system management tool with agent-controller architecture for remote PC control and monitoring.**

MdsWinShepherd provides a modern, web-based dashboard to manage Windows systems remotely through a lightweight agent service. Perfect for system administrators, IT professionals, and power users who need reliable remote Windows management.

## � Features

### 🎮 **System Control**
- **Program Management**: Start and stop Windows applications remotely
- **System Operations**: Restart PC, manage network connectivity  
- **Real-time Monitoring**: Live system status updates via WebSocket
- **Process Management**: View and control running processes

### 🏗️ **Architecture**
- **🔧 Agent Service**: Lightweight Node.js + TypeScript Windows service
- **🎨 Controller Dashboard**: Modern Next.js + Tailwind CSS web interface
- **🖥️ Desktop App**: Electron wrapper for native desktop experience
- **⚡ Real-time Communication**: WebSocket + REST API integration

### 🛡️ **Built for Windows**
- Native Windows command integration
- PowerShell support for advanced operations
- Windows service architecture
- Executable compilation for easy deployment



## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install all dependencies for agent, controller, and electron
npm run install:all

# OR install manually:
cd agent && npm install
cd ../controller/nextjs && npm install  
cd ../electron && npm install
```

### 2. Development Mode

**Option A: Start everything together (Recommended)**
```bash
npm run dev
```

**Option B: Start components separately**
```bash
# Terminal 1: Start agent (port 3001)
cd agent && npm run dev

# Terminal 2: Start Next.js dashboard (port 3000) 
cd controller/nextjs && npm run dev

# Terminal 3: Start Electron wrapper
cd controller/electron && npm run dev
```

This will:
- ✅ Agent running on `http://localhost:3001`
- ✅ Dashboard running on `http://localhost:3000`  
- ✅ Electron desktop app launched

### 3. Production Build
```bash
# Build everything
npm run build

# OR build individually:
npm run agent:build      # Creates agent.exe
npm run controller:build # Builds Next.js + Electron app
```

### 4. Testing the System

**Quick Health Check:**
```bash
# Test if agent is running
curl http://localhost:3001/health

# Get system status
curl http://localhost:3001/status
```

**Test Commands:**
```bash
# Start Notepad
curl -X POST http://localhost:3001/start -H "Content-Type: application/json" -d "{\"path\":\"C:\\\\Windows\\\\System32\\\\notepad.exe\"}"

# Stop Notepad  
curl -X POST http://localhost:3001/stop -H "Content-Type: application/json" -d "{\"name\":\"notepad\"}"
```

## 📁 Project Structure

```
mds-win-shepherd/
├── agent/                    # Windows Agent Service
│   ├── src/
│   │   ├── index.ts         # Express server & WebSocket
│   │   └── commands.ts      # Windows command implementations
│   ├── package.json
│   └── tsconfig.json
├── controller/              # Dashboard Controller
│   ├── electron/           # Electron wrapper
│   │   ├── src/main.ts     # Electron main process
│   │   └── package.json
│   └── nextjs/            # Next.js dashboard
│       ├── app/
│       │   ├── page.tsx    # Main dashboard UI
│       │   ├── layout.tsx  # App layout
│       │   └── api/        # API routes (proxy to agents)
│       └── package.json
└── package.json            # Root workspace config
```

## 🔧 API Endpoints

### Agent API (Port 3001)
- `GET /health` - Health check
- `GET /status` - Get system status
- `POST /start` - Start program `{"path": "C:\\Program.exe"}`
- `POST /stop` - Stop program `{"name": "notepad"}`
- `POST /restart` - Restart PC
- `POST /disconnect` - Disconnect internet
- `POST /reconnect` - Reconnect internet

### WebSocket Events
- `status` - System status updates
- `log` - Activity messages  
- `error` - Error notifications

## 💻 Usage Examples

### Starting a Program
```bash
curl -X POST http://localhost:3001/start -H "Content-Type: application/json" -d '{"path":"C:\\Windows\\System32\\notepad.exe"}'
```

### Stopping a Program
```bash
curl -X POST http://localhost:3001/stop -H "Content-Type: application/json" -d '{"name":"notepad"}'
```

### Getting System Status
```bash
curl http://localhost:3001/status
```

## 🛠️ Development

### Agent Development
```bash
cd agent
npm run dev  # Hot reload with ts-node-dev
```

### Controller Development
```bash
cd controller
npm run dev  # Starts Next.js + Electron
```

### Building Agent Executable
```bash
cd agent
npm run build  # Creates agent.exe using pkg
```

### Building Desktop App
```bash
cd controller/electron
npm run dist  # Creates installer using electron-builder
```

## 🔒 Security Considerations

- Agents should run on trusted networks only
- Consider adding authentication for production use
- Network adapter controls require administrator privileges
- Restart commands have immediate effect

## 🐛 Troubleshooting

### Agent Won't Start
- Check Windows Defender/antivirus isn't blocking
- Run as Administrator for network adapter controls
- Verify ports 3001 isn't in use

### Commands Fail
- Ensure programs exist at specified paths
- Check process names are correct (include .exe)
- Verify network adapter names for disconnect/reconnect

### Connection Issues
- Check firewall settings for port 3001
- Verify agent is running and accessible
- Test with curl before using dashboard

## 📋 Todo / Future Enhancements

- [ ] Add authentication and HTTPS
- [ ] Multi-agent registration and discovery
- [ ] Process monitoring and auto-restart
- [ ] File transfer capabilities
- [ ] Remote desktop viewer
- [ ] Scheduled task management
- [ ] Windows service installer
- [ ] Agent auto-update mechanism

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mds-win-shepherd/issues)
- **Documentation**: Check the `/docs` folder (coming soon)
- **Community**: Join our discussions in GitHub Discussions

## 🙏 Acknowledgments

- Built with ❤️ for the Windows system administration community
- Inspired by the need for simple, effective remote PC management
- Thanks to all contributors and users of MdsWinShepherd

---

**MdsWinShepherd v1.0.0** - Your trusted Windows System Shepherd 🐑