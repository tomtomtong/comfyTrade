# Where to Find Your Imported Plugins

## Quick Answer

After importing a plugin, **scroll down** in the Node Library (left sidebar) to find it.

## Visual Guide

```
┌─────────────────────────────────────┐
│  Node Library              📦 Import│  ← Click here to import
├─────────────────────────────────────┤
│                                     │
│  ▼ Triggers                         │
│    ⚡ Trigger                       │
│                                     │
│  ▼ Signals                          │
│    📱 Twilio Alert                  │
│    📝 String Input                  │
│    📊 yFinance Data                 │
│    🤖 LLM Node                      │
│    🕷️ Firecrawl Scraper            │
│    🐍 Python Script                 │
│    📄 String Output                 │
│                                     │
│  ▼ Indicators                       │
│    Moving Average                   │
│    RSI                              │
│                                     │
│  ▼ Logic                            │
│    Conditional Check                │
│    🔍 String Contains               │
│    AND Gate                         │
│    OR Gate                          │
│                                     │
│  ▼ Trading                          │
│    Open Position                    │
│    Close Position                   │
│    Modify Position                  │
│                                     │
│  ▼ Control                          │
│    🏁 End Strategy                  │
│                                     │
│  ▼ Custom Nodes          ← NEW!    │  ← Your plugins appear here
│    👋 Hello World        ← PLUGIN  │
│    🔄 Text Transformer   ← PLUGIN  │
│    🔢 Math Calculator    ← PLUGIN  │
│                                     │
└─────────────────────────────────────┘
```

## Step-by-Step

### 1. Import Your Plugin
- Click the **📦 Import** button (top-right of Node Library)
- Select your `.js` plugin file
- Wait for success message

### 2. Find Your Plugin
- **Scroll down** in the Node Library (left sidebar)
- Look for a new section called **"Custom Nodes"**
- Your plugin button will be there with its icon and title

### 3. Use Your Plugin
- Click the plugin button
- Node appears in center of canvas
- Connect and use like any other node

## Plugin Categories

Plugins can appear in different categories based on their `category` setting:

| Category Value | Section Name | Location |
|---------------|--------------|----------|
| `'custom'` (default) | Custom Nodes | Bottom of list (new section) |
| `'indicators'` | Indicators | Existing section |
| `'logic'` | Logic | Existing section |
| `'trading'` | Trading | Existing section |
| `'signals'` | Signals | Existing section |
| `'control'` | Control | Existing section |

## Example: Hello World Plugin

After importing `hello-world.js`:

```
┌─────────────────────────────────────┐
│  Node Library              📦 Import│
├─────────────────────────────────────┤
│  ... (other categories) ...         │
│                                     │
│  ▼ Custom Nodes                     │  ← New section created
│    👋 Hello World                   │  ← Your plugin!
│                                     │
└─────────────────────────────────────┘
```

Click "👋 Hello World" → Node appears on canvas!

## Troubleshooting

### "I don't see my plugin!"

1. **Check for success message**
   - Should say: "✓ Plugin 'Your Plugin' loaded!"
   - If not, check browser console for errors

2. **Scroll down**
   - Custom plugins appear at the bottom
   - You may need to scroll in the Node Library

3. **Check the right category**
   - If your plugin has `category: 'indicators'`, look in Indicators section
   - Default is `category: 'custom'` → Custom Nodes section

4. **Look for the icon**
   - Plugins show their icon (emoji) before the title
   - Example: 👋 Hello World, 🔄 Text Transformer

5. **Check browser console**
   - Press F12 to open DevTools
   - Look for messages like:
     ```
     Created new category: custom
     Added button for plugin: Hello World in category: custom
     ✓ Plugin loaded successfully: Hello World (hello-world)
     ```

### "The button is there but nothing happens when I click it!"

1. **Check console for errors**
   - Press F12 → Console tab
   - Click the button
   - Look for error messages

2. **Try refreshing the page**
   - Sometimes a refresh helps
   - Re-import the plugin after refresh

3. **Verify plugin structure**
   - Make sure `execute` function exists
   - Check that `inputs` and `outputs` are defined

## Quick Test

To verify the system works, try importing this minimal plugin:

**File: test-plugin.js**
```javascript
module.exports = {
  id: 'test-123',
  title: 'Test Plugin',
  category: 'custom',
  icon: '✅',
  inputs: ['trigger'],
  outputs: ['trigger'],
  params: {},
  async execute(node, inputData, context) {
    context.showMessage('Plugin system works!', 'success');
    return true;
  }
};
```

After importing:
1. Scroll to bottom of Node Library
2. Look for "Custom Nodes" section
3. Find "✅ Test Plugin" button
4. Click it → node appears on canvas

If this works, your plugin system is functioning correctly!

## Need Help?

See `PLUGIN_TROUBLESHOOTING.md` for detailed debugging steps.
