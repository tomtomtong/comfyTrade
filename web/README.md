# ComfyTrade - Web Demo

A web-based demo version of ComfyTrade, the open source MT5 node-based trading strategy builder.

🚀 **[View Full Project on GitHub](https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5)**

## About This Demo

This is a limited web demo showcasing the core node editor functionality. For the full experience with real MT5 integration, download the desktop application from the GitHub repository.

**Live Stats**: The demo tracks unique visitors to show community interest in the project.

### Demo Features

- 🎨 Visual node-based strategy builder
- 📊 Simulated trading with demo market data
- 💰 Paper trading without real money
- 📈 Real-time price updates (simulated)
- 💾 Save/Load strategy graphs

### Full Version Features

The complete desktop application includes:

- ✅ **Real MT5 Integration** - Connect to your MetaTrader 5 terminal
- ✅ **Advanced Risk Management** - Volume limits, overtrade protection, pip-based calculations
- ✅ **Historical Backtesting** - Import and test strategies against historical data
- ✅ **Custom Indicators** - Moving Average, RSI, and more
- ✅ **SMS/WhatsApp Alerts** - Real-time notifications via Twilio
- ✅ **Plugin System** - Create custom nodes for any data source or logic
- ✅ **Market Sentiment Analysis** - Integrate news and sentiment data
- ✅ **Trade Journal** - Track and analyze your trading performance
- ✅ **Cross-Platform** - Windows, Mac, and Linux support

## Get the Full Version

### Download Desktop App

Visit the [GitHub Releases](https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5/releases) page to download the latest version for your platform.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5.git
cd comfyTrade-node-editor-for-MT5

# Install dependencies
npm install
pip install -r requirements.txt

# Run the application
npm start
```

## Deploy This Demo to Railway

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/mt5-trader)

### Manual Deploy

1. Fork the repository
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Railway will auto-detect and deploy

## Local Development

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start the server
npm start

# Open http://localhost:3000
```

## How to Use the Demo

1. Click "Connect Demo" to start the simulator
2. Add nodes from the left panel by clicking them
3. Connect nodes by dragging from output sockets to input sockets
4. Configure node parameters in the right panel
5. Use "New Trade" to execute simulated trades
6. Save your strategies with the "Save" button

## Node Types

### Triggers
- **Trigger**: Starting point for strategy execution

### Data
- **String Input**: Custom text input
- **String Output**: Display text output
- **MT5 Data**: Market data from MT5 (simulated in demo)

### Indicators
- **Moving Average**: Calculate MA
- **RSI**: Relative Strength Index

### Logic
- **Conditional Check**: Price conditions
- **AND Gate**: Both inputs must be true
- **OR Gate**: Either input can be true

### Trading
- **Open Position**: Execute buy/sell orders
- **Close Position**: Close existing positions
- **Modify Position**: Change SL/TP

### Control
- **End Strategy**: Stop strategy execution

## Demo Limitations

This web demo has the following limitations:

- ❌ No real MT5 connection
- ❌ Simulated market prices only
- ❌ Paper trading only (no real money)
- ❌ Limited symbol selection
- ❌ No historical data import
- ❌ No SMS/WhatsApp alerts
- ❌ No plugin system
- ❌ No sentiment analysis

**For full functionality, download the desktop version!**

## Support & Contact

- 📧 Email: [tomtomtongtong@gmail.com](mailto:tomtomtongtong@gmail.com)
- 🐛 Report Issues: [GitHub Issues](https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5/discussions)
- ⭐ Star the Project: [GitHub Repository](https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5)

## Tech Stack

- Node.js + Express
- Vanilla JavaScript
- HTML5 Canvas for node editor
- No database (in-memory storage)

## License

MIT License - See the [main repository](https://github.com/tomtomtong/comfyTrade-node-editor-for-MT5) for details.

---

**Made with ❤️ by the ComfyTrade community**
