# Plugin System Troubleshooting Guide

## Problem: Plugin Loads But Button Doesn't Appear

### Solution Steps:

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error messages
   - Check if plugin loaded successfully

2. **Verify Plugin Category**
   - Plugin buttons appear in their specified category
   - Default category is "custom" → creates "Custom Nodes" section
   - Check if a new category section was created at the bottom of the node library

3. **Check Plugin Structure**
   ```javascript
   // Make sure your plugin has these required fields:
   module.exports = {
     id: 'unique-id',        // Required
     title: 'Display Name',  // Required
     category: 'custom',     // Optional, defaults to 'custom'
     inputs: ['trigger'],    // Required (array)
     outputs: ['trigger'],   // Required (array)
     execute: async (node, inputData, context) => { // Required
       return true;
     }
   };
   ```

4. **Scroll Down in Node Library**
   - Custom plugins appear at the bottom
   - Look for "Custom Nodes" section
   - Or the category you specified

## Testing Steps

### Step 1: Test with Hello World Plugin

1. Use the provided `plugins/examples/hello-world.js`
2. Click "📦 Import" button
3. Select `hello-world.js`
4. Look for success message: "✓ Plugin 'Hello World' loaded!"
5. Scroll to bottom of node library
6. Look for "Custom Nodes" section
7. Find "👋 Hello World" button

### Step 2: Verify in Console

Open browser console and check for these messages:
```
Loading plugin: {id: 'hello-world', title: 'Hello World', ...}
Plugin stored in map. Total plugins: 1
Plugin registered with node editor
Created new category: custom
Added button for plugin: Hello World in category: custom
✓ Plugin loaded successfully: Hello World (hello-world)
```

### Step 3: Test the Node

1. Click the plugin button
2. Node should appear in center of canvas
3. Select the node
4. Check properties panel on right
5. Connect a Trigger node to it
6. Run the strategy

## Common Issues

### Issue 1: "Plugin manager not initialized"

**Cause**: Plugin manager didn't load before trying to import

**Solution**:
- Refresh the page
- Make sure `node-plugin-manager.js` is loaded
- Check console for script loading errors

### Issue 2: "Plugin validation failed"

**Cause**: Plugin structure is incorrect

**Solution**:
- Check required fields: `id`, `title`, `execute`
- Ensure `inputs` and `outputs` are arrays
- Verify `execute` is a function

**Example of correct structure**:
```javascript
module.exports = {
  id: 'test',
  title: 'Test',
  inputs: [],
  outputs: [],
  params: {},
  async execute(node, inputData, context) {
    return true;
  }
};
```

### Issue 3: Button appears but clicking does nothing

**Cause**: Node editor can't create the node

**Solution**:
- Check console for errors
- Verify plugin is in the plugins map
- Make sure `getNodeConfig` override is working

**Debug in console**:
```javascript
// Check if plugin is loaded
window.nodePluginManager.getPlugins()

// Check if plugin is in map
window.nodePluginManager.plugins.has('your-plugin-id')

// Try to add node manually
nodeEditor.addNode('your-plugin-id', 100, 100)
```

### Issue 4: Node appears but won't execute

**Cause**: Execute function has errors

**Solution**:
- Add try-catch in execute function
- Check context object is available
- Verify return value (true/false)

**Debug template**:
```javascript
async execute(node, inputData, context) {
  try {
    console.log('Plugin executing:', node.type);
    console.log('Input data:', inputData);
    console.log('Context:', context);
    
    // Your logic here
    
    return true;
  } catch (error) {
    console.error('Plugin execution error:', error);
    context.showMessage(`Error: ${error.message}`, 'error');
    return false;
  }
}
```

## Verification Checklist

- [ ] Plugin file is valid JavaScript
- [ ] `module.exports` is used correctly
- [ ] All required fields are present
- [ ] `id` is unique (no conflicts)
- [ ] `inputs` and `outputs` are arrays
- [ ] `execute` is an async function
- [ ] Browser console shows no errors
- [ ] Success message appears after import
- [ ] Button appears in node library
- [ ] Clicking button creates node
- [ ] Node can be connected to other nodes
- [ ] Node executes without errors

## Debug Commands

Open browser console and try these:

```javascript
// Check if plugin manager exists
window.nodePluginManager

// List all loaded plugins
window.nodePluginManager.getPlugins()

// Check specific plugin
window.nodePluginManager.plugins.get('your-plugin-id')

// Check node editor
nodeEditor

// List all nodes on canvas
nodeEditor.nodes

// Check if node type is recognized
nodeEditor.getNodeConfig('your-plugin-id')
```

## Still Not Working?

### Collect Debug Information

1. **Browser Console Output**
   - Copy all messages after importing plugin
   - Include any error messages

2. **Plugin Code**
   - Share your plugin code
   - Verify syntax is correct

3. **Steps Taken**
   - What you clicked
   - What you expected
   - What actually happened

4. **Screenshots**
   - Node library (showing categories)
   - Browser console
   - Any error messages

### Quick Test

Try this minimal plugin to verify the system works:

```javascript
module.exports = {
  id: 'test-plugin',
  title: 'Test',
  inputs: ['trigger'],
  outputs: ['trigger'],
  params: {},
  async execute(node, inputData, context) {
    context.showMessage('Test plugin works!', 'success');
    return true;
  }
};
```

Save this as `test.js` and import it. If this works, the system is functioning correctly.

## Expected Behavior

### After Successful Import:

1. **Success message appears**: "✓ Plugin 'Your Plugin' loaded! Check the 'custom' category."
2. **Console shows**: Multiple log messages about plugin loading
3. **Node library updates**: New category or button appears
4. **Button is clickable**: Creates node when clicked
5. **Node works**: Can be connected and executed

### Plugin Button Location:

- **Custom category**: Bottom of node library, new "Custom Nodes" section
- **Existing category**: Added to that category (e.g., 'indicators', 'logic')
- **Scroll down**: May need to scroll to see new categories

## Contact Support

If you've tried everything and it still doesn't work:
- Check GitHub issues
- Post in community forums
- Include debug information above
