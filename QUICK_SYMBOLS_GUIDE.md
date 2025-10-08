# Quick Symbols Feature Guide

## Overview
The Quick Symbols feature provides convenient one-click access to frequently used trading symbols throughout the application.

## Features

### 1. Configurable Symbol List
- Access settings via the **⚙ Settings** button in the toolbar
- Add custom symbols (e.g., XAUUSD, BTCUSD, etc.)
- Remove symbols you don't use
- Reset to defaults (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD)
- Configuration is saved automatically to localStorage

### 2. Quick Symbol Buttons
Quick symbol buttons appear in multiple locations:

- **Trade Execution Dialog**: Click any symbol button to instantly populate the symbol field
- **Node Properties**: When editing trade nodes, quick symbols appear below the symbol input
- **Future Locations**: The system is designed to be easily extended to other areas

### 3. Usage

#### Managing Quick Symbols
1. Click **⚙ Settings** in the toolbar
2. View your current quick symbols
3. To add a symbol:
   - Type the symbol name (e.g., XAUUSD)
   - Click **Add** or press Enter
4. To remove a symbol:
   - Click the **×** button next to the symbol
5. To reset to defaults:
   - Click **Reset to Defaults**

#### Using Quick Symbols
1. Open any dialog with a symbol input (Trade dialog, Node properties, etc.)
2. Click any quick symbol button
3. The symbol is instantly populated in the input field

## Technical Details

### Files
- `config.js` - Configuration management and localStorage persistence
- `quick-symbols.js` - Reusable QuickSymbols component
- Settings UI integrated in `index.html` and `renderer.js`

### For Developers

#### Adding Quick Symbols to New Components

```javascript
// Method 1: With a SymbolInput instance
const symbolInput = new SymbolInput(container, options);
QuickSymbols.createForSymbolInput(quickSymbolsContainer, symbolInput);

// Method 2: With a custom callback
QuickSymbols.create(quickSymbolsContainer, (symbol) => {
  // Handle symbol selection
  console.log('Selected:', symbol);
});

// Method 3: With custom options
QuickSymbols.create(container, callback, {
  className: 'custom-quick-symbols',
  buttonClass: 'custom-btn',
  symbols: ['CUSTOM1', 'CUSTOM2'] // Override default symbols
});
```

#### Accessing Configuration

```javascript
// Get current symbols
const symbols = AppConfig.getQuickSymbols();

// Add a symbol programmatically
AppConfig.addQuickSymbol('XAUUSD');

// Remove a symbol
AppConfig.removeQuickSymbol('XAUUSD');

// Save changes
AppConfig.saveToLocalStorage();
```

## Benefits

1. **Faster Trading**: One-click symbol selection saves time
2. **Consistency**: Use the same symbols across all features
3. **Customizable**: Tailor the list to your trading style
4. **Persistent**: Your configuration is saved between sessions
5. **Reusable**: Easy to add to new features as the app grows
