# Technology Stack

## Architecture
Hybrid desktop application using Electron with Python bridge for MT5 integration.

## Frontend Stack
- **Electron**: Desktop application framework
- **HTML/CSS/JavaScript**: UI implementation
- **Canvas API**: Node editor rendering and interactions
- **WebSocket**: Real-time communication with Python bridge
- **LocalStorage**: Data persistence for historical data and settings

## Backend Stack
- **Node.js**: Electron main process and IPC handling
- **Python 3.8+**: MT5 integration bridge
- **MetaTrader5 Python API**: Direct MT5 terminal communication
- **WebSockets**: Async communication between Electron and Python

## Key Dependencies
- **Electron**: ^28.0.0 (desktop framework)
- **ws**: ^8.18.3 (WebSocket client)
- **MetaTrader5**: >=5.0.45 (Python MT5 API)
- **websockets**: >=12.0 (Python WebSocket server)

## Build System
- **electron-builder**: Application packaging and distribution
- **npm scripts**: Development and build automation

## Common Commands

### Development
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start development
npm start          # Launch application
npm run dev        # Launch with DevTools enabled

# Build for distribution
npm run build      # Build for current platform
npm run build:win  # Build for Windows
npm run dist       # Build without publishing
```

### Python Bridge
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run bridge manually (if needed)
python mt5_bridge.py
```

## Communication Flow
```
Electron UI ↔ WebSocket (port 8765) ↔ Python Bridge ↔ MT5 API
```

## File Organization
- Frontend: HTML/CSS/JS files in root
- Backend: main.js (Electron), mt5_bridge.py (Python)
- Build: electron-builder configuration in package.json