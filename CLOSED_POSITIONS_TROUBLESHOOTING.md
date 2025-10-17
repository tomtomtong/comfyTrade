# 🔧 Closed Positions Feature Troubleshooting

## Error: "No handler registered for 'mt5:getClosedPositions'"

This error indicates that the Electron main process hasn't registered the new IPC handler. Here's how to fix it:

### 🚀 **Solution 1: Restart the Application**

The most common cause is that the application needs to be restarted after adding new IPC handlers.

1. **Close the MT5 Strategy Builder completely**
2. **Restart the application**
3. **Connect to MT5**
4. **Try the closed positions feature again**

### 🔍 **Solution 2: Verify Installation**

Check that all files have been properly updated:

#### Required Files and Changes:

1. **main.js** - Should contain:
```javascript
ipcMain.handle('mt5:getClosedPositions', async (event, daysBack) => {
    try {
        const result = await mt5Bridge.getClosedPositions(daysBack);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
```

2. **preload.js** - Should contain:
```javascript
getClosedPositions: (daysBack) => ipcRenderer.invoke('mt5:getClosedPositions', daysBack)
```

3. **mt5-bridge.js** - Should contain:
```javascript
async getClosedPositions(daysBack = 7) {
    if (!this.connected) {
        throw new Error('Not connected to MT5');
    }
    console.log(`Getting closed positions for last ${daysBack} days...`);
    const response = await this.sendMessage('getClosedPositions', { daysBack });
    return response.data;
}
```

4. **mt5_bridge.py** - Should contain:
```python
def get_closed_positions(self, days_back=7):
    # Implementation here...

# And in handle_message:
elif action == 'getClosedPositions':
    days_back = data.get('daysBack', 7)
    result = self.get_closed_positions(days_back)
    response['data'] = result
```

### 🧪 **Solution 3: Debug Test**

1. Open the application
2. Connect to MT5
3. Open Developer Tools (F12)
4. Copy and paste the contents of `test-closed-positions-debug.js` into the console
5. Check the output for specific errors

### 🔄 **Solution 4: Manual Verification**

Run these commands in the browser console after connecting to MT5:

```javascript
// Check if API exists
console.log('MT5 API methods:', Object.keys(window.mt5API));

// Test the method directly
window.mt5API.getClosedPositions(7)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### 🐛 **Common Issues**

1. **Application not restarted** - Most common cause
2. **MT5 not connected** - Feature requires active MT5 connection
3. **Python bridge not running** - Check if mt5_bridge.py is running
4. **File changes not saved** - Ensure all files were properly saved
5. **Cache issues** - Try clearing browser cache or hard refresh (Ctrl+F5)

### 📋 **Step-by-Step Verification**

1. ✅ **Check main.js** - Contains `ipcMain.handle('mt5:getClosedPositions'...)`
2. ✅ **Check preload.js** - Contains `getClosedPositions: (daysBack) => ...`
3. ✅ **Check mt5-bridge.js** - Contains `async getClosedPositions(daysBack = 7)`
4. ✅ **Check mt5_bridge.py** - Contains `def get_closed_positions(self, days_back=7)`
5. ✅ **Restart application completely**
6. ✅ **Connect to MT5**
7. ✅ **Test closed positions tab**

### 🆘 **If Still Not Working**

1. **Check console for errors** - Look for any JavaScript errors
2. **Verify Python bridge** - Ensure mt5_bridge.py is running without errors
3. **Test with debug script** - Use the debug script to identify the exact issue
4. **Check file permissions** - Ensure all files are readable/writable
5. **Restart computer** - Sometimes helps with file system caching issues

### 📞 **Getting Help**

If the issue persists, provide:
1. Console error messages
2. Output from the debug script
3. Whether you restarted the application
4. MT5 connection status
5. Operating system and Electron version

---

## 🎯 **Expected Behavior After Fix**

Once working correctly, you should see:
- ✅ "Closed Positions" tab in the bottom panel
- ✅ Dropdown to select time range (1-30 days)
- ✅ "Refresh" button to load data
- ✅ Summary statistics (Total P&L, Win Rate, etc.)
- ✅ Individual position cards with profit/loss details
- ✅ Color-coded results (green for profit, red for loss)

The feature will show your MT5 trading history with detailed profit/loss analysis!