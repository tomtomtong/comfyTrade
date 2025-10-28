# Quick Start: Python Script Node

## Adding the Node

1. Open the Node Editor
2. Find "🐍 Python Script" in the **Signals** category (left panel)
3. Click to add it to the canvas

## Basic Setup

### Step 1: Write Your Script
1. Select the Python Script node
2. In the Properties panel (right side), find the "Python Script" textarea
3. Write your Python code
4. **Important**: Set the `result` variable for output

Example:
```python
result = "Hello from Python!"
```

### Step 2: Test Your Script
1. Click the "🐍 Run Script" button in the Properties panel
2. Check the success message for output
3. Fix any errors if they appear

### Step 3: Connect to Your Strategy
1. Connect a **Trigger** node to the Python Script's trigger input (left side, top)
2. Connect the Python Script's **string output** (right side, top) to other nodes like:
   - String Output (to display results)
   - String Contains (to check for keywords)
   - Twilio Alert (to send the result)
   - Another Python Script (to chain processing)

## Using Input Data

### Enable String Input
1. In Properties panel, check "Use String Input"
2. Connect a string output from another node to the Python Script's string input (left side, bottom)

### Access Input in Your Script
The input data is available in the `input_data` variable (or custom name):

```python
# Convert input to uppercase
result = input_data.upper()
```

### Change Input Variable Name
1. In Properties panel, change "Input Variable Name" field
2. Use that name in your script:

```python
# If you set variable name to "my_input"
result = my_input.lower()
```

## Common Workflows

### 1. Simple Text Processing
```
String Input → Python Script → String Output
```

### 2. Data Analysis
```
yFinance Data → Python Script → String Output
```

### 3. Conditional Alerts
```
LLM Node → Python Script → String Contains → Twilio Alert
```

### 4. Web Scraping Pipeline
```
Firecrawl → Python Script → String Output
```

## Quick Examples

### Example 1: Add Timestamp
```python
import datetime
now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
result = f"[{now}] {input_data}"
```

### Example 2: Calculate Percentage
```python
# Input format: "100,150"
old, new = map(float, input_data.split(','))
change = ((new - old) / old) * 100
result = f"Change: {change:+.2f}%"
```

### Example 3: Format JSON
```python
import json
data = json.loads(input_data)
result = f"Symbol: {data['symbol']}, Price: ${data['price']:.2f}"
```

### Example 4: Text Analysis
```python
words = input_data.split()
result = f"Word count: {len(words)}, Characters: {len(input_data)}"
```

## Tips

✅ **DO:**
- Always set the `result` variable
- Test your script before running the full strategy
- Use try-except for error handling
- Keep scripts simple and fast

❌ **DON'T:**
- Forget to set `result` (your output will be empty)
- Use complex loops or heavy computations (may slow down strategy)
- Try to access files or network (not allowed for security)

## Troubleshooting

### "No output" message
- Make sure you set `result = "your value"`
- Check for syntax errors in your script

### "Error: ..." message
- Read the error message carefully
- Common issues:
  - Syntax errors (missing quotes, parentheses)
  - Undefined variables
  - Type errors (trying to add string + number)

### Script not executing
- Make sure MT5 is connected (green status)
- Check that trigger input is connected
- Verify Python bridge is running

## Need More Help?

- See `PYTHON_SCRIPT_NODE.md` for full documentation
- Check `examples/python_script_examples.md` for 10 detailed examples
- Test your script using the "🐍 Run Script" button before deploying

## Available Modules

You can use these Python modules in your scripts:
- `datetime` - Date and time
- `json` - JSON data
- `math` - Math functions
- `re` - Regular expressions

Plus standard functions: `len`, `str`, `int`, `float`, `list`, `dict`, `sum`, `min`, `max`, etc.
