# Quick Symbols API Reference

## AppConfig Object

### Properties
```javascript
AppConfig.quickSymbols  // Array of symbol strings
```

### Methods

#### `getQuickSymbols()`
Returns the current array of quick symbols.
```javascript
const symbols = AppConfig.getQuickSymbols();
// Returns: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD']
```

#### `addQuickSymbol(symbol)`
Adds a new symbol to the quick symbols list.
```javascript
AppConfig.addQuickSymbol('XAUUSD');
// Automatically saves to localStorage
```

#### `removeQuickSymbol(symbol)`
Removes a symbol from the quick symbols list.
```javascript
AppConfig.removeQuickSymbol('XAUUSD');
// Automatically saves to localStorage
```

#### `saveToLocalStorage()`
Manually save configuration to localStorage.
```javascript
AppConfig.saveToLocalStorage();
```

#### `loadFromLocalStorage()`
Load configuration from localStorage (called automatically on startup).
```javascript
AppConfig.loadFromLocalStorage();
```

---

## QuickSymbols Class

### Static Methods

#### `create(container, onSymbolClick, options)`
Creates quick symbol buttons in a container.

**Parameters:**
- `container` (HTMLElement) - Container to append buttons to
- `onSymbolClick` (Function) - Callback when symbol is clicked, receives symbol string
- `options` (Object, optional) - Configuration options

**Options:**
- `className` (string) - CSS class for wrapper div (default: 'quick-symbols')
- `buttonClass` (string) - CSS class for buttons (default: 'quick-symbol-btn')
- `symbols` (Array) - Override default symbols

**Returns:** HTMLElement (the wrapper div)

**Example:**
```javascript
QuickSymbols.create(
  document.getElementById('myContainer'),
  (symbol) => {
    console.log('Selected:', symbol);
    myInput.value = symbol;
  },
  {
    className: 'my-quick-symbols',
    symbols: ['CUSTOM1', 'CUSTOM2']
  }
);
```

#### `createForSymbolInput(container, symbolInput)`
Helper method to create quick symbols for a SymbolInput instance.

**Parameters:**
- `container` (HTMLElement) - Container to append buttons to
- `symbolInput` (SymbolInput) - SymbolInput instance

**Returns:** HTMLElement (the wrapper div)

**Example:**
```javascript
const symbolInput = new SymbolInput(inputContainer, options);
QuickSymbols.createForSymbolInput(quickSymbolsContainer, symbolInput);
```

#### `update(container)`
Updates existing quick symbol buttons with current configuration.

**Parameters:**
- `container` (HTMLElement) - Container with existing quick-symbols div

**Example:**
```javascript
// After modifying AppConfig
QuickSymbols.update(document.getElementById('myContainer'));
```

---

## HTML Structure

### Quick Symbols Container
```html
<div id="myQuickSymbolsContainer"></div>
```

### Generated Structure
```html
<div class="quick-symbols">
  <button class="quick-symbol-btn" data-symbol="EURUSD">EURUSD</button>
  <button class="quick-symbol-btn" data-symbol="GBPUSD">GBPUSD</button>
  <!-- ... more buttons ... -->
</div>
```

---

## CSS Classes

### `.quick-symbols`
Container for quick symbol buttons
```css
.quick-symbols {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
```

### `.quick-symbol-btn`
Individual symbol button
```css
.quick-symbol-btn {
  padding: 4px 8px;
  background: #444;
  border: 1px solid #555;
  border-radius: 3px;
  color: #ccc;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-symbol-btn:hover {
  background: #4CAF50;
  border-color: #4CAF50;
  color: white;
}
```

---

## Integration Examples

### Example 1: Simple Input Field
```javascript
const input = document.getElementById('symbolInput');
const container = document.getElementById('quickSymbolsContainer');

QuickSymbols.create(container, (symbol) => {
  input.value = symbol;
});
```

### Example 2: With SymbolInput Component
```javascript
const symbolInput = new SymbolInput(inputContainer, {
  placeholder: 'Enter symbol',
  onSymbolSelect: (symbol) => {
    console.log('Selected:', symbol);
  }
});

QuickSymbols.createForSymbolInput(quickSymbolsContainer, symbolInput);
```

### Example 3: Custom Symbols
```javascript
QuickSymbols.create(container, (symbol) => {
  handleSymbolSelection(symbol);
}, {
  symbols: ['BTCUSD', 'ETHUSD', 'XRPUSD']
});
```

### Example 4: Dynamic Update
```javascript
// Initial creation
QuickSymbols.create(container, callback);

// Later, after config changes
AppConfig.addQuickSymbol('XAUUSD');
QuickSymbols.update(container);
```

---

## Events

Quick symbol buttons emit standard click events. The component handles these internally, but you can also listen to them:

```javascript
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('quick-symbol-btn')) {
    const symbol = e.target.dataset.symbol;
    console.log('Quick symbol clicked:', symbol);
  }
});
```

---

## LocalStorage

Configuration is stored in localStorage under the key `appConfig`:

```javascript
{
  "quickSymbols": ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"]
}
```

To manually inspect or modify:
```javascript
// Get
const config = JSON.parse(localStorage.getItem('appConfig'));

// Set
localStorage.setItem('appConfig', JSON.stringify({
  quickSymbols: ['CUSTOM1', 'CUSTOM2']
}));

// Clear
localStorage.removeItem('appConfig');
```
