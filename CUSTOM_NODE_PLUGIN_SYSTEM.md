# Custom Node Plugin System

## Overview

The MT5 Trading Strategy Executor now supports custom node plugins, allowing developers to create and share their own node types without modifying the core application.

## Plugin Architecture

### Plugin Structure

A custom node plugin is a JavaScript file that exports a node definition:

```javascript
// my-custom-node.js
module.exports = {
  // Unique identifier for your node
  id: 'my-custom-node',
  
  // Display information
  title: 'My Custom Node',
  category: 'custom', // 'custom', 'indicators', 'logic', 'trading', 'signals'
  icon: '🎨', // Optional emoji icon
  description: 'Description of what this node does',
  
  // Node configuration
  inputs: ['trigger', 'string'], // Array of input types: 'trigger', 'string', 'number'
  outputs: ['string', 'trigger'], // Array of output types
  
  // Default parameters
  params: {
    myParam: 'default value',
    anotherParam: 42,
    enabled: true
  },
  
  // Parameter UI configuration (optional)
  paramConfig: {
    myParam: {
      type: 'text', // 'text', 'number', 'checkbox', 'select', 'textarea'
      label: 'My Parameter',
      placeholder: 'Enter value...',
      tooltip: 'This parameter does X'
    },
    anotherParam: {
      type: 'number',
      label: 'Another Parameter',
      min: 0,
      max: 100,
      step: 1
    },
    enabled: {
      type: 'checkbox',
      label: 'Enable Feature'
    }
  },
  
  // Execution function
  async execute(node, inputData, context) {
    // node: The node instance with params
    // inputData: Data from connected input nodes
    // context: { mt5API, showMessage, connections, nodes }
    
    try {
      // Your custom logic here
      const result = `Processed: ${inputData}`;
      
      // Set output data
      node.outputData = result;
      
      // Return true to continue flow, false to stop
      return true;
      
    } catch (error) {
      context.showMessage(`Error in ${node.title}: ${error.message}`, 'error');
      return false;
    }
  },
  
  // Optional: Custom property panel rendering
  renderProperties(node, updateParam) {
    // Return HTML string for custom property UI
    return `
      <div class="property-item">
        <label>Custom UI:</label>
        <button onclick="alert('Custom action!')">Click Me</button>
      </div>
    `;
  },
  
  // Optional: Validation function
  validate(node) {
    // Return error message if invalid, null if valid
    if (!node.params.myParam) {
      return 'myParam is required';
    }
    return null;
  }
};
```

## Creating a Custom Node

### Example 1: Simple Text Transformer

```javascript
// text-transformer.js
module.exports = {
  id: 'text-transformer',
  title: 'Text Transformer',
  category: 'custom',
  icon: '🔄',
  description: 'Transform text with various operations',
  
  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],
  
  params: {
    operation: 'uppercase',
    prefix: '',
    suffix: ''
  },
  
  paramConfig: {
    operation: {
      type: 'select',
      label: 'Operation',
      options: [
        { value: 'uppercase', label: 'UPPERCASE' },
        { value: 'lowercase', label: 'lowercase' },
        { value: 'reverse', label: 'Reverse' },
        { value: 'capitalize', label: 'Capitalize' }
      ]
    },
    prefix: {
      type: 'text',
      label: 'Prefix',
      placeholder: 'Text to add before...'
    },
    suffix: {
      type: 'text',
      label: 'Suffix',
      placeholder: 'Text to add after...'
    }
  },
  
  async execute(node, inputData, context) {
    let text = inputData || '';
    
    // Apply operation
    switch (node.params.operation) {
      case 'uppercase':
        text = text.toUpperCase();
        break;
      case 'lowercase':
        text = text.toLowerCase();
        break;
      case 'reverse':
        text = text.split('').reverse().join('');
        break;
      case 'capitalize':
        text = text.charAt(0).toUpperCase() + text.slice(1);
        break;
    }
    
    // Add prefix/suffix
    text = node.params.prefix + text + node.params.suffix;
    
    node.outputData = text;
    return true;
  }
};
```

### Example 2: API Caller

```javascript
// api-caller.js
module.exports = {
  id: 'api-caller',
  title: 'API Caller',
  category: 'custom',
  icon: '🌐',
  description: 'Call external REST APIs',
  
  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],
  
  params: {
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: '{}',
    body: '',
    useInputAsBody: false
  },
  
  paramConfig: {
    url: {
      type: 'text',
      label: 'API URL',
      placeholder: 'https://...'
    },
    method: {
      type: 'select',
      label: 'HTTP Method',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' }
      ]
    },
    headers: {
      type: 'textarea',
      label: 'Headers (JSON)',
      placeholder: '{"Authorization": "Bearer token"}'
    },
    body: {
      type: 'textarea',
      label: 'Request Body',
      placeholder: 'Request body...'
    },
    useInputAsBody: {
      type: 'checkbox',
      label: 'Use Input as Body'
    }
  },
  
  async execute(node, inputData, context) {
    try {
      const headers = JSON.parse(node.params.headers || '{}');
      const body = node.params.useInputAsBody ? inputData : node.params.body;
      
      // Note: In actual implementation, you'd need to expose fetch or axios
      // through the context or use the Python bridge
      const response = await fetch(node.params.url, {
        method: node.params.method,
        headers: headers,
        body: node.params.method !== 'GET' ? body : undefined
      });
      
      const data = await response.text();
      node.outputData = data;
      
      context.showMessage(`API call successful: ${response.status}`, 'success');
      return true;
      
    } catch (error) {
      context.showMessage(`API call failed: ${error.message}`, 'error');
      node.outputData = `Error: ${error.message}`;
      return false;
    }
  },
  
  validate(node) {
    if (!node.params.url) {
      return 'URL is required';
    }
    try {
      new URL(node.params.url);
    } catch {
      return 'Invalid URL format';
    }
    return null;
  }
};
```

### Example 3: Data Aggregator

```javascript
// data-aggregator.js
module.exports = {
  id: 'data-aggregator',
  title: 'Data Aggregator',
  category: 'custom',
  icon: '📊',
  description: 'Aggregate data from multiple inputs',
  
  inputs: ['trigger', 'string', 'string', 'string'], // Multiple string inputs
  outputs: ['string', 'trigger'],
  
  params: {
    operation: 'concat',
    separator: ', ',
    format: 'text'
  },
  
  paramConfig: {
    operation: {
      type: 'select',
      label: 'Operation',
      options: [
        { value: 'concat', label: 'Concatenate' },
        { value: 'sum', label: 'Sum (numbers)' },
        { value: 'average', label: 'Average (numbers)' },
        { value: 'max', label: 'Maximum' },
        { value: 'min', label: 'Minimum' }
      ]
    },
    separator: {
      type: 'text',
      label: 'Separator',
      placeholder: ', '
    },
    format: {
      type: 'select',
      label: 'Output Format',
      options: [
        { value: 'text', label: 'Plain Text' },
        { value: 'json', label: 'JSON' },
        { value: 'csv', label: 'CSV' }
      ]
    }
  },
  
  async execute(node, inputData, context) {
    // Get all string inputs
    const inputs = [];
    const connections = context.connections.filter(c => c.to === node);
    
    for (const conn of connections) {
      if (conn.toInput > 0) { // Skip trigger input
        const sourceNode = conn.from;
        if (sourceNode.outputData) {
          inputs.push(sourceNode.outputData);
        }
      }
    }
    
    let result;
    
    switch (node.params.operation) {
      case 'concat':
        result = inputs.join(node.params.separator);
        break;
        
      case 'sum':
        result = inputs.reduce((sum, val) => sum + parseFloat(val || 0), 0);
        break;
        
      case 'average':
        const sum = inputs.reduce((s, val) => s + parseFloat(val || 0), 0);
        result = inputs.length > 0 ? sum / inputs.length : 0;
        break;
        
      case 'max':
        result = Math.max(...inputs.map(v => parseFloat(v || 0)));
        break;
        
      case 'min':
        result = Math.min(...inputs.map(v => parseFloat(v || 0)));
        break;
    }
    
    // Format output
    if (node.params.format === 'json') {
      result = JSON.stringify({ inputs, result, operation: node.params.operation });
    } else if (node.params.format === 'csv') {
      result = inputs.join(',');
    }
    
    node.outputData = String(result);
    return true;
  }
};
```

## Loading Custom Nodes

### Method 1: Plugin Folder

Place your plugin files in the `plugins/nodes/` directory:

```
mt5-trader/
├── plugins/
│   └── nodes/
│       ├── text-transformer.js
│       ├── api-caller.js
│       └── data-aggregator.js
```

The application will automatically load all `.js` files from this directory on startup.

### Method 2: Import via UI

1. Click "Import Custom Node" button in the node library
2. Select your `.js` plugin file
3. The node will be added to the "Custom" category

### Method 3: Programmatic Loading

```javascript
// In renderer.js or your custom script
window.nodePluginManager.loadPlugin('/path/to/plugin.js');
```

## Sharing Plugins

### Publishing

1. Create a GitHub repository for your plugin
2. Include:
   - Plugin file (`.js`)
   - README with description and usage
   - Examples
   - License

### Installing from URL

```javascript
window.nodePluginManager.loadPluginFromURL('https://raw.githubusercontent.com/user/plugin/main/plugin.js');
```

## Plugin API Reference

### Context Object

The `context` object passed to `execute()` provides:

```javascript
{
  // MT5 API access
  mt5API: {
    getAccountInfo: async () => {},
    executeOrder: async (orderData) => {},
    getMarketData: async (symbol) => {},
    // ... all MT5 API methods
  },
  
  // UI functions
  showMessage: (message, type) => {}, // type: 'success', 'error', 'warning', 'info'
  
  // Graph access
  connections: [], // All connections in the graph
  nodes: [], // All nodes in the graph
  
  // Utilities
  getConnectedInputs: (node) => [], // Get all input connections
  getConnectedOutputs: (node) => [], // Get all output connections
  findNodeById: (id) => {}, // Find node by ID
  
  // Storage
  localStorage: {
    get: (key) => {},
    set: (key, value) => {}
  }
}
```

### Node Instance Properties

```javascript
{
  id: 'unique-id',
  type: 'node-type',
  title: 'Node Title',
  x: 100, // Canvas position
  y: 200,
  width: 180,
  height: 120,
  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],
  params: { /* your parameters */ },
  outputData: null, // Set this in execute()
  lastResult: true, // Last execution result
  lastExecutionTime: Date.now()
}
```

## Best Practices

1. **Error Handling**: Always wrap your logic in try-catch
2. **Validation**: Implement the `validate()` function
3. **Documentation**: Include clear descriptions and tooltips
4. **Performance**: Keep execution fast (< 100ms)
5. **Testing**: Test with various input combinations
6. **Versioning**: Include version in your plugin metadata
7. **Dependencies**: Document any external dependencies

## Security Considerations

- Plugins run in the renderer process with limited privileges
- No direct file system access (use provided APIs)
- Network requests should be validated
- Sanitize user inputs
- Don't store sensitive data in params

## Example Plugin Repository Structure

```
my-custom-node/
├── README.md
├── LICENSE
├── package.json (optional, for npm publishing)
├── src/
│   └── my-custom-node.js
├── examples/
│   ├── example-workflow.json
│   └── screenshots/
└── tests/
    └── test.js
```

## Community Plugins

Share your plugins on:
- GitHub with topic `mt5-trader-plugin`
- Plugin marketplace (coming soon)
- Community forum

## Troubleshooting

### Plugin Not Loading
- Check console for errors
- Verify plugin exports correct structure
- Ensure unique `id` (no conflicts)

### Execution Errors
- Check `context` object availability
- Verify async/await usage
- Test with simple inputs first

### UI Issues
- Validate HTML in `renderProperties()`
- Check parameter types in `paramConfig`
- Test with different screen sizes
