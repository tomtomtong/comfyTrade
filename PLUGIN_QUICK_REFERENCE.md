# Plugin System - Quick Reference

## Import a Plugin

1. Click **📦 Import** button (Node Library, top-left)
2. Select `.js` file
3. Node appears in "Custom Nodes" category

## Create a Plugin

### Minimal Template
```javascript
module.exports = {
  id: 'my-node',
  title: 'My Node',
  inputs: ['trigger'],
  outputs: ['trigger'],
  params: {},
  async execute(node, inputData, context) {
    return true;
  }
};
```

### With String I/O
```javascript
module.exports = {
  id: 'my-processor',
  title: 'My Processor',
  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],
  params: { myParam: 'default' },
  async execute(node, inputData, context) {
    node.outputData = 'processed: ' + inputData;
    return true;
  }
};
```

### With Parameters
```javascript
module.exports = {
  id: 'my-config-node',
  title: 'My Config Node',
  inputs: ['trigger'],
  outputs: ['trigger'],
  params: {
    text: 'hello',
    number: 42,
    enabled: true,
    option: 'a'
  },
  paramConfig: {
    text: {
      type: 'text',
      label: 'Text Input'
    },
    number: {
      type: 'number',
      label: 'Number',
      min: 0,
      max: 100
    },
    enabled: {
      type: 'checkbox',
      label: 'Enable Feature'
    },
    option: {
      type: 'select',
      label: 'Choose Option',
      options: [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' }
      ]
    }
  },
  async execute(node, inputData, context) {
    // Access params: node.params.text, node.params.number, etc.
    return true;
  }
};
```

## Context API

```javascript
async execute(node, inputData, context) {
  // Show message
  context.showMessage('Hello!', 'success'); // 'success', 'error', 'warning', 'info'
  
  // MT5 API
  const account = await context.mt5API.getAccountInfo();
  const positions = await context.mt5API.getPositions();
  
  // Graph access
  const allNodes = context.nodes;
  const allConnections = context.connections;
  
  // Find nodes
  const myNode = context.findNodeById('some-id');
  const inputs = context.getConnectedInputs(node);
  const outputs = context.getConnectedOutputs(node);
  
  // Storage
  context.localStorage.set('myKey', 'myValue');
  const value = context.localStorage.get('myKey');
  
  // Set output
  node.outputData = 'result';
  
  return true; // or false to stop flow
}
```

## Common Patterns

### Get Input from Connected Node
```javascript
async execute(node, inputData, context) {
  // inputData contains the string from connected node
  const text = String(inputData || '');
  // Process text...
  node.outputData = text.toUpperCase();
  return true;
}
```

### Access Parameters
```javascript
async execute(node, inputData, context) {
  const myValue = node.params.myParam;
  // Use myValue...
  return true;
}
```

### Error Handling
```javascript
async execute(node, inputData, context) {
  try {
    // Your logic
    return true;
  } catch (error) {
    context.showMessage(`Error: ${error.message}`, 'error');
    return false;
  }
}
```

### Validation
```javascript
validate(node) {
  if (!node.params.required) {
    return 'Required parameter is missing';
  }
  if (node.params.number < 0) {
    return 'Number must be positive';
  }
  return null; // Valid
}
```

### Call MT5 API
```javascript
async execute(node, inputData, context) {
  // Get account info
  const account = await context.mt5API.getAccountInfo();
  
  // Get market data
  const data = await context.mt5API.getMarketData('EURUSD');
  
  // Execute order
  const result = await context.mt5API.executeOrder({
    symbol: 'EURUSD',
    type: 'BUY',
    volume: 0.1,
    stopLoss: 0,
    takeProfit: 0
  });
  
  return true;
}
```

## Parameter Types

| Type | Description | Config |
|------|-------------|--------|
| `text` | Text input | `{ type: 'text', label: 'Label', placeholder: '...' }` |
| `number` | Number input | `{ type: 'number', label: 'Label', min: 0, max: 100, step: 1 }` |
| `checkbox` | Boolean | `{ type: 'checkbox', label: 'Label' }` |
| `select` | Dropdown | `{ type: 'select', label: 'Label', options: [{value, label}] }` |
| `textarea` | Multi-line | `{ type: 'textarea', label: 'Label', rows: 4 }` |

## Input/Output Types

- `trigger` - Execution flow (required for most nodes)
- `string` - Text data
- `number` - Numeric data (future support)

## Categories

- `custom` - Custom Nodes (default)
- `indicators` - Technical Indicators
- `logic` - Logic & Conditions
- `trading` - Trading Operations
- `signals` - Data & Signals
- `control` - Flow Control

## Examples

### Text Processor
```javascript
module.exports = {
  id: 'text-upper',
  title: 'Uppercase',
  icon: '🔤',
  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],
  params: {},
  async execute(node, inputData, context) {
    node.outputData = String(inputData).toUpperCase();
    return true;
  }
};
```

### Number Generator
```javascript
module.exports = {
  id: 'random-num',
  title: 'Random Number',
  icon: '🎲',
  inputs: ['trigger'],
  outputs: ['string', 'trigger'],
  params: { min: 0, max: 100 },
  async execute(node, inputData, context) {
    const num = Math.random() * (node.params.max - node.params.min) + node.params.min;
    node.outputData = num.toFixed(2);
    return true;
  }
};
```

### Conditional
```javascript
module.exports = {
  id: 'check-value',
  title: 'Check Value',
  icon: '✓',
  inputs: ['trigger', 'string'],
  outputs: ['trigger'],
  params: { threshold: 50 },
  async execute(node, inputData, context) {
    const value = parseFloat(inputData);
    if (value > node.params.threshold) {
      context.showMessage('Value exceeds threshold!', 'warning');
      return true;
    }
    return false; // Stop flow
  }
};
```

## Tips

✅ **DO:**
- Use unique IDs
- Handle errors
- Validate inputs
- Show user feedback
- Keep execution fast
- Document your code

❌ **DON'T:**
- Use conflicting IDs
- Ignore errors
- Block execution
- Forget to set outputData
- Skip validation

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Plugin not loading | Check console, verify syntax |
| Node not appearing | Check ID uniqueness, reload |
| Execution fails | Add try-catch, check context |
| No output | Set `node.outputData` |
| Parameters not showing | Check `paramConfig` structure |

## Resources

- **Full Docs**: `CUSTOM_NODE_PLUGIN_SYSTEM.md`
- **Examples**: `plugins/examples/`
- **Guide**: `plugins/README.md`
