# Python Script Node

The Python Script node allows you to execute custom Python code within your trading strategy workflow. This provides powerful flexibility to process data, perform calculations, or implement custom logic.

## Features

- **Custom Python Execution**: Write and execute Python code directly in the node editor
- **String Input/Output**: Accept string data from other nodes and output processed results
- **Safe Execution Environment**: Runs in a controlled environment with access to common Python modules
- **Real-time Testing**: Test your scripts directly from the properties panel

## Available Modules

The Python Script node provides access to the following modules:
- `datetime` - Date and time operations
- `json` - JSON encoding/decoding
- `math` - Mathematical functions
- `re` - Regular expressions
- Standard built-in functions: `len`, `str`, `int`, `float`, `bool`, `list`, `dict`, `tuple`, `set`, `range`, `enumerate`, `zip`, `map`, `filter`, `sum`, `min`, `max`, `abs`, `round`, `sorted`, `reversed`, `any`, `all`

## Usage

### Basic Example

```python
# Simple calculation
result = "The answer is: " + str(42 * 2)
```

### Using Input Data

When "Use String Input" is enabled and a string input is connected:

```python
# Process input data (default variable name: input_data)
result = input_data.upper()
```

### Advanced Example

```python
import json
import datetime

# Parse JSON input
data = json.loads(input_data)

# Process data
current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
result = f"Processed at {current_time}: {data['symbol']} = {data['price']}"
```

### Mathematical Operations

```python
import math

# Calculate compound interest
principal = 1000
rate = 0.05
time = 10
amount = principal * math.pow((1 + rate), time)

result = f"Investment grows to: ${amount:.2f}"
```

## Node Configuration

### Parameters

- **Python Script**: Multi-line text area for your Python code
  - Must set the `result` variable for output
  - Syntax errors will be reported when executed

- **Use String Input**: Checkbox to enable string input from connected nodes
  - When enabled, accepts data from String Input, LLM, yFinance, Firecrawl, or other Python Script nodes

- **Input Variable Name**: Name of the variable containing input data (default: `input_data`)
  - Customize this to match your script's variable naming

### Inputs

1. **Trigger** (required): Executes the script when triggered
2. **String** (optional): Accepts string data when "Use String Input" is enabled

### Outputs

1. **String**: The value of the `result` variable after script execution
2. **Trigger**: Continues the flow to connected nodes (passes if script succeeds, blocks if it fails)

## Example Workflows

### 1. Data Transformation Pipeline

```
String Input → Python Script → String Output
```

Transform or format data before displaying or sending alerts.

### 2. LLM Response Processing

```
LLM Node → Python Script → String Contains → Twilio Alert
```

Process LLM responses, check for keywords, and send conditional alerts.

### 3. Financial Calculations

```
yFinance Data → Python Script → String Output
```

Fetch stock data and perform custom calculations or analysis.

### 4. Multi-Step Processing

```
Firecrawl → Python Script → Python Script → String Output
```

Chain multiple Python scripts for complex data processing pipelines.

## Tips

1. **Always set `result`**: Your script must set the `result` variable for output
   ```python
   result = "Your output here"
   ```

2. **Error Handling**: Wrap risky operations in try-except blocks
   ```python
   try:
       result = str(int(input_data) * 2)
   except ValueError:
       result = "Invalid input"
   ```

3. **Test Frequently**: Use the "🐍 Run Script" button to test your code before running the full strategy

4. **Keep It Simple**: Complex operations may slow down strategy execution

5. **String Conversion**: Always convert `result` to string if it's not already
   ```python
   result = str(my_value)
   ```

## Security Notes

The Python Script node runs in a restricted environment for safety:
- No file system access
- No network operations (except through provided modules)
- Limited to safe built-in functions
- Cannot import arbitrary modules

This ensures your trading strategies remain secure while providing powerful scripting capabilities.
