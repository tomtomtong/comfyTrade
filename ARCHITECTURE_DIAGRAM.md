# Quick Symbols Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Settings   │  │ Trade Dialog │  │     Node     │      │
│  │    Modal     │  │              │  │  Properties  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Component Layer                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │         QuickSymbols Component                     │     │
│  │  (quick-symbols.js)                                │     │
│  │                                                     │     │
│  │  • create(container, callback, options)            │     │
│  │  • createForSymbolInput(container, symbolInput)    │     │
│  │  • update(container)                               │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │         AppConfig Object                           │     │
│  │  (config.js)                                       │     │
│  │                                                     │     │
│  │  • quickSymbols: Array                             │     │
│  │  • getQuickSymbols()                               │     │
│  │  • addQuickSymbol(symbol)                          │     │
│  │  • removeQuickSymbol(symbol)                       │     │
│  │  • saveToLocalStorage()                            │     │
│  │  • loadFromLocalStorage()                          │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Persistence Layer                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Browser LocalStorage                       │     │
│  │                                                     │     │
│  │  Key: "appConfig"                                  │     │
│  │  Value: { quickSymbols: [...] }                   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Loading Configuration (App Startup)
```
Browser LocalStorage
        │
        ▼
AppConfig.loadFromLocalStorage()
        │
        ▼
AppConfig.quickSymbols = [...]
        │
        ▼
QuickSymbols.create() uses AppConfig.getQuickSymbols()
        │
        ▼
Buttons rendered in UI
```

### 2. User Adds Symbol
```
User types in Settings Modal
        │
        ▼
Click "Add" button
        │
        ▼
addQuickSymbol() called
        │
        ▼
AppConfig.addQuickSymbol(symbol)
        │
        ├─▶ Add to quickSymbols array
        │
        └─▶ AppConfig.saveToLocalStorage()
                │
                ▼
        Browser LocalStorage updated
                │
                ▼
        updateAllQuickSymbols() called
                │
                ▼
        All UI instances refreshed
```

### 3. User Clicks Quick Symbol Button
```
User clicks button
        │
        ▼
Click event captured
        │
        ▼
Callback function executed
        │
        ▼
Symbol value set in input field
        │
        ▼
Application logic continues
(e.g., fetch price, validate, etc.)
```

## Component Integration Points

### Trade Dialog
```javascript
// In renderer.js - initializeSymbolInput()
const quickSymbolsContainer = document.getElementById('tradeQuickSymbolsContainer');
QuickSymbols.create(quickSymbolsContainer, (symbol) => {
  symbolInput.setValue(symbol);
  updateCurrentPrice(symbol);
});
```

### Node Properties
```javascript
// In renderer.js - showNodeProperties()
const quickSymbolsContainer = document.getElementById(`nodeQuickSymbols-${node.id}`);
QuickSymbols.create(quickSymbolsContainer, (symbol) => {
  nodeSymbolInput.setValue(symbol);
  updateNodeParam('symbol', symbol);
});
```

### Settings Modal
```javascript
// In renderer.js - showSettingsModal()
renderQuickSymbolsList(); // Display current symbols
// User can add/remove symbols
// Changes saved to AppConfig and localStorage
updateAllQuickSymbols(); // Refresh all UI instances
```

## File Dependencies

```
index.html
    │
    ├─▶ config.js (loaded first)
    │       │
    │       └─▶ Defines AppConfig
    │
    ├─▶ quick-symbols.js (loaded second)
    │       │
    │       └─▶ Defines QuickSymbols class
    │           Uses AppConfig
    │
    ├─▶ symbol-input.js
    │
    ├─▶ node-editor.js
    │
    └─▶ renderer.js (loaded last)
            │
            └─▶ Uses QuickSymbols and AppConfig
                Implements UI logic
```

## CSS Structure

```
styles.css
    │
    ├─▶ .quick-symbols (container)
    │       display: flex
    │       gap: 8px
    │       flex-wrap: wrap
    │
    ├─▶ .quick-symbol-btn (button)
    │       background: #444
    │       hover: #4CAF50
    │
    ├─▶ .quick-symbols-list (settings display)
    │       background: #2a2a2a
    │
    └─▶ .quick-symbol-item (settings item)
            display: flex
            with remove button
```

## Extension Points

To add quick symbols to a new feature:

1. **Add HTML container**
   ```html
   <div id="myQuickSymbolsContainer"></div>
   ```

2. **Initialize in JavaScript**
   ```javascript
   QuickSymbols.create(
     document.getElementById('myQuickSymbolsContainer'),
     (symbol) => {
       // Handle symbol selection
     }
   );
   ```

3. **Update on config change** (optional)
   ```javascript
   // Add to updateAllQuickSymbols() in renderer.js
   const myContainer = document.getElementById('myQuickSymbolsContainer');
   if (myContainer) {
     QuickSymbols.update(myContainer);
   }
   ```

## Security Considerations

- **LocalStorage**: Data stored in browser, not transmitted
- **Input Validation**: Symbols validated before adding
- **XSS Prevention**: Text content set via textContent, not innerHTML
- **No External Dependencies**: Self-contained, no CDN risks

## Performance Characteristics

- **Load Time**: Minimal (< 1ms to load config)
- **Render Time**: Fast (< 10ms for 10 buttons)
- **Memory**: Negligible (< 1KB for config)
- **Storage**: Minimal (< 1KB in localStorage)
- **Updates**: Instant (synchronous operations)
