# Troubleshooting: Strategy Not Executing Trades

## Problem
Test button works ✅, but "Run Strategy" doesn't execute trades ❌

## Quick Diagnosis

Open the Developer Console (`Ctrl+Shift+I`) and run:

```javascript
window.debugStrategy()
```

This will show you exactly what's wrong.

---

## Common Issues

### 1. ❌ Nodes Not Connected

**Symptom:**
```
⚠️ Trigger is NOT connected to any Open Position nodes!
```

**Solution:**
1. Click on the **Trigger node** output socket (green circle on the right)
2. Drag to the **Open Position node** input socket (blue circle on the left)
3. Release to create the connection
4. You should see a blue line connecting them

**Visual Guide:**
```
┌─────────┐         ┌──────────────┐
│ Trigger │ ●──────→● Open Position│
└─────────┘         └──────────────┘
   (green)             (blue)
```

---

### 2. ❌ Trigger Node Disabled

**Symptom:**
```
Trigger disabled, skipping execution
```

**Solution:**
1. Select the Trigger node
2. In the properties panel, check if there's an "enabled" parameter
3. Make sure it's set to `true` or checked

---

### 3. ❌ No Trigger Nodes

**Symptom:**
```
No trigger nodes found.
```

**Solution:**
1. Click the **"Trigger"** button in the node palette (left side)
2. The trigger node will appear on the canvas
3. Connect it to your Open Position node

---

### 4. ❌ Overtrade Control Blocking (Strategy Level)

**Symptom:**
- Test button works
- Strategy shows "cancelled" message

**Solution:**
The overtrade control check happens **twice**:
1. When you click "Run Strategy" (checks if you can run the strategy)
2. When each trade executes (checks if you can open a position)

If blocked at strategy level:
- Go to **Settings → Overtrade Control**
- Increase the max trades limit
- Or temporarily disable overtrade control

---

## Step-by-Step Verification

### Step 1: Check Your Setup

Run in console:
```javascript
window.debugStrategy()
```

You should see:
```
✓ Trigger nodes present
✓ Open Position nodes present
✓ Nodes are connected
✓ MT5 connected
```

### Step 2: Check Console During Execution

When you click "Run Strategy", you should see:

```
=== Trigger started: Trigger ===
Trigger node: {...}
Connected nodes from trigger: 1
  1. Open Position (trade-signal)
Executing connected node: Open Position
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Executing node: Open Position Type: trade-signal
=== TRADE-SIGNAL NODE EXECUTION START ===
Node params: {action: "BUY", symbol: "EURUSD", ...}
MT5 API available: true
...
✓ Trade executed successfully
```

### Step 3: What You Should NOT See

**Bad - No connected nodes:**
```
=== Trigger started: Trigger ===
Connected nodes from trigger: 0
⚠️ No nodes connected to trigger!
```
**Fix:** Connect the nodes!

**Bad - Trigger not executing:**
```
(nothing in console)
```
**Fix:** Check if trigger is enabled or if strategy was cancelled

---

## Detailed Debugging

### Check Node Connections Manually

```javascript
// See all connections
console.log(nodeEditor.connections);

// Check specific connection
const trigger = nodeEditor.nodes.find(n => n.type === 'trigger');
const trade = nodeEditor.nodes.find(n => n.type === 'trade-signal');
const connection = nodeEditor.connections.find(c => c.from === trigger && c.to === trade);

console.log('Connection exists:', !!connection);
```

### Manually Execute Trigger

```javascript
// Find trigger node
const trigger = nodeEditor.nodes.find(n => n.type === 'trigger');

// Execute it manually
nodeEditor.executeTrigger(trigger);
```

This will show you exactly what happens when the trigger fires.

---

## Comparison: Test Button vs Strategy

| Aspect | Test Button | Run Strategy |
|--------|-------------|--------------|
| Requires trigger | ❌ No | ✅ Yes |
| Requires connection | ❌ No | ✅ Yes |
| Checks overtrade (strategy) | ❌ No | ✅ Yes |
| Checks overtrade (trade) | ✅ Yes | ✅ Yes |
| Executes immediately | ✅ Yes | ⚠️ Only if connected |

---

## Most Likely Cause

**90% of the time, the issue is: Nodes are not connected!**

### How to Fix:
1. Look at your canvas
2. Do you see a **blue line** from Trigger to Open Position?
3. If NO → Connect them!
4. If YES → Run `window.debugStrategy()` to find the real issue

---

## Visual Connection Guide

### ❌ Wrong - Not Connected
```
┌─────────┐    ┌──────────────┐
│ Trigger │    │ Open Position│
└─────────┘    └──────────────┘
```

### ✅ Correct - Connected
```
┌─────────┐         ┌──────────────┐
│ Trigger │●────────●Open Position│
└─────────┘         └──────────────┘
```

The line should be visible on the canvas!

---

## Still Not Working?

### 1. Check Console Logs

Look for these messages:
- `=== Trigger started ===` - Trigger is firing
- `Connected nodes from trigger: X` - Should be > 0
- `Executing connected node` - Node is being executed
- `=== TRADE-SIGNAL NODE EXECUTION START ===` - Trade code is running

### 2. Try Execute Once Mode

Instead of periodic execution:
1. Click "Run Strategy"
2. Select **"Execute Once"**
3. Click "Run Strategy"
4. Watch the console

### 3. Restart the App

Sometimes a fresh start helps:
1. Close the app
2. Reopen it
3. Reconnect to MT5
4. Try again

### 4. Recreate the Nodes

If all else fails:
1. Delete all nodes (select and press Delete)
2. Add a new Trigger node
3. Add a new Open Position node
4. Configure the Open Position node
5. Connect them (drag from green to blue)
6. Test with the test button
7. Run strategy

---

## Success Checklist

Before running your strategy, verify:

- [ ] MT5 is connected (green status)
- [ ] Trigger node exists on canvas
- [ ] Open Position node exists on canvas
- [ ] Nodes are connected (visible blue line)
- [ ] Open Position is configured (symbol, action, volume)
- [ ] Test button works (✅ Trade executed)
- [ ] `window.debugStrategy()` shows all ✓

If all checked, your strategy should work!

---

## Need More Help?

Run these commands and share the output:

```javascript
// 1. Strategy debug
window.debugStrategy()

// 2. Manual trigger test
const trigger = nodeEditor.nodes.find(n => n.type === 'trigger');
nodeEditor.executeTrigger(trigger);

// 3. Check connections
console.log('Connections:', nodeEditor.connections);
```
