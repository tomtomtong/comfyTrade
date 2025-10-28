# Custom Node Plugins

This directory contains custom node plugins for the MT5 Trading Strategy Executor.

## Quick Start

### Using Example Plugins

1. Click the "📦 Import" button in the Node Library (left sidebar)
2. Select a plugin file from `plugins/examples/`
3. The node will appear in the "Custom Nodes" category
4. Drag it onto the canvas and use it like any other node

### Available Example Plugins

- **text-transformer.js** - Transform text (uppercase, lowercase, reverse, capitalize)
- **math-calculator.js** - Perform mathematical operations on numbers
- **delay-node.js** - Add delays to your strategy execution

## Creating Your Own Plugin

### Basic Template

```javascript
module.exports = {
  // Unique identifier
  id: 'my-plugin',
  
  // Display name
  title: 'My Plugin',
  
  // Category: 'custom', 'indicators', 'logic', 'trading', 'signals'
  category: 'custom',
  
  // Optional emoji icon
  icon: '🎨',
  
  // Description shown in tooltip
  description: 'What this plugin does',
  
  // Input types: 'trigger', 'string', 'number'
  inputs: ['trigger', 'string'],
  
  // Output types: 'trigger', 'string', 'number'
  outputs: ['string', 'trigger'],
  
  // Default parameters
  params: {
    myParam: 'default value'
  },
  
  // Optional: Parameter UI configuration
  paramConfig: {
    myParam: {
      type: 'text', // 'text', 'number', 'checkbox', 'select', 'textarea'
      label: 'My Parameter',
      placeholder: 'Enter value...'
    }
  },
  
  // Execution function (required)
  async execute(node, inputData, context) {
    // Your logic here
    node.outputData = 'result';
    return true; // true = continue, false = stop
  },
  
  // Optional: Validation function
  validate(node) {
    if (!node.params.myParam) {
      return 'myParam is required';
    }
    return null; // null = valid
  }
};
```

### Context API

The `context` object provides access to:

```javascript
{
  // MT5 API
  mt5API: {
    getAccountInfo: async () => {},
    executeOrder: async (orderData) => {},
    getMarketData: async (symbol) => {},
    // ... all MT5 methods
  },
  
  // UI
  showMessage: (message, type) => {}, // type: 'success', 'error', 'warning', 'info'
  
  // Graph
  connections: [], // All connections
  nodes: [], // All nodes
  
  // Utilities
  getConnectedInputs: (node) => [],
  getConnectedOutputs: (node) => [],
  findNodeById: (id) => {},
  
  // Storage
  localStorage: {
    get: (key) => {},
    set: (key, value) => {}
  }
}
```

## Plugin Examples

### Example 1: Simple Counter

```javascript
module.exports = {
  id: 'counter',
  title: 'Counter',
  category: 'custom',
  icon: '🔢',
  
  inputs: ['trigger'],
  outputs: ['string', 'trigger'],
  
  params: {
    count: 0
  },
  
  async execute(node, inputData, context) {
    node.params.count++;
    node.outputData = String(node.params.count);
    context.showMessage(`Count: ${node.params.count}`, 'info');
    return true;
  }
};
```

### Example 2: Random Number Generator

```javascript
module.exports = {
  id: 'random-number',
  title: 'Random Number',
  category: 'custom',
  icon: '🎲',
  
  inputs: ['trigger'],
  outputs: ['string', 'trigger'],
  
  params: {
    min: 0,
    max: 100
  },
  
  paramConfig: {
    min: {
      type: 'number',
      label: 'Minimum'
    },
    max: {
      type: 'number',
      label: 'Maximum'
    }
  },
  
  async execute(node, inputData, context) {
    const min = parseFloat(node.params.min);
    const max = parseFloat(node.params.max);
    const random = Math.random() * (max - min) + min;
    node.outputData = random.toFixed(2);
    return true;
  },
  
  validate(node) {
    if (node.params.min >= node.params.max) {
      return 'Minimum must be less than maximum';
    }
    return null;
  }
};
```

### Example 3: Conditional Router

```javascript
module.exports = {
  id: 'conditional-router',
  title: 'Conditional Router',
  category: 'custom',
  icon: '🔀',
  
  inputs: ['trigger', 'string'],
  outputs: ['trigger', 'trigger'], // Two outputs: true path, false path
  
  params: {
    condition: 'contains',
    value: ''
  },
  
  paramConfig: {
    condition: {
      type: 'select',
      label: 'Condition',
      options: [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts With' },
        { value: 'endsWith', label: 'Ends With' }
      ]
    },
    value: {
      type: 'text',
      label: 'Value to Check'
    }
  },
  
  async execute(node, inputData, context) {
    const input = String(inputData || '');
    const value = node.params.value;
    let result = false;
    
    switch (node.params.condition) {
      case 'contains':
        result = input.includes(value);
        break;
      case 'equals':
        result = input === value;
        break;
      case 'startsWith':
        result = input.startsWith(value);
        break;
      case 'endsWith':
        result = input.endsWith(value);
        break;
    }
    
    // Route to appropriate output
    // Output 0 = true path, Output 1 = false path
    node.routeToOutput = result ? 0 : 1;
    
    return true;
  }
};
```

## Best Practices

1. **Unique IDs**: Use descriptive, unique IDs (e.g., 'my-company-node-name')
2. **Error Handling**: Always wrap logic in try-catch
3. **Validation**: Implement validate() for parameter checking
4. **Performance**: Keep execution fast (< 100ms)
5. **Documentation**: Add clear descriptions and tooltips
6. **Testing**: Test with various inputs before sharing

## Sharing Your Plugins

### GitHub Repository

Create a repository with:
```
my-plugin/
├── README.md
├── LICENSE
├── my-plugin.js
├── examples/
│   └── example-workflow.json
└── screenshots/
```

### Plugin Metadata (Optional)

Add metadata to your plugin:

```javascript
module.exports = {
  id: 'my-plugin',
  title: 'My Plugin',
  version: '1.0.0',
  author: 'Your Name',
  license: 'MIT',
  repository: 'https://github.com/user/my-plugin',
  // ... rest of plugin
};
```

## Troubleshooting

### Plugin Not Loading
- Check browser console for errors
- Verify `module.exports` syntax
- Ensure unique ID

### Execution Errors
- Check if `context` is being used correctly
- Verify async/await usage
- Test with simple inputs first

### UI Issues
- Validate paramConfig structure
- Check for typos in parameter types
- Test with different parameter values

## Community

Share your plugins:
- Tag with `mt5-trader-plugin` on GitHub
- Post in community forums
- Submit to plugin marketplace (coming soon)

## Support

For help:
- Check `CUSTOM_NODE_PLUGIN_SYSTEM.md` for full documentation
- Review example plugins in `plugins/examples/`
- Ask in community forums
