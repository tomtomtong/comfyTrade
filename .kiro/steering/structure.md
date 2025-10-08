# Project Structure

## Root Directory Layout
```
mt5-trader/
├── Frontend Files (UI)
├── Backend Files (Electron + Python)
├── Configuration Files
├── Documentation
└── Build Output
```

## Frontend Files
- `index.html` - Main UI structure and layout
- `renderer.js` - Main application logic and UI controllers
- `node-editor.js` - Node-based strategy builder engine
- `history-import.js` - Historical data import functionality
- `symbol-input.js` - Symbol input with autocomplete
- `overtrade-control.js` - Risk management controls
- `styles.css` - Application styling and themes

## Backend Files
- `main.js` - Electron main process and window management
- `preload.js` - Secure API bridge between renderer and main
- `mt5-bridge.js` - WebSocket client for Python communication
- `mt5_bridge.py` - Python bridge for MT5 API integration

## Configuration Files
- `package.json` - Node.js dependencies and build scripts
- `requirements.txt` - Python dependencies
- `sample_history.csv` - Example CSV format for data import

## Documentation
- `README.md` - Comprehensive project documentation
- `DOCUMENTATION.md` - Detailed feature documentation

## Build & Distribution
- `dist/` - Build output directory (generated)
- `node_modules/` - Node.js dependencies (generated)

## Development Files
- `.vscode/` - VS Code workspace settings
- `.git/` - Git version control
- `.gitignore` - Git ignore patterns

## Key Architectural Patterns

### Module Organization
- **Single Responsibility**: Each JS file handles one major feature area
- **Separation of Concerns**: UI logic separate from business logic
- **Event-Driven**: Heavy use of event listeners and callbacks

### File Naming Conventions
- Kebab-case for all files: `node-editor.js`, `history-import.js`
- Descriptive names indicating functionality
- Python files use snake_case: `mt5_bridge.py`

### Code Organization Within Files
- Class-based approach for complex modules (NodeEditor, MT5Bridge)
- Global state management in renderer.js
- Modular functions for specific features
- Clear separation between setup, event handling, and business logic