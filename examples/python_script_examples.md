# Python Script Node Examples

This file contains practical examples for using the Python Script node in your trading strategies.

## Example 1: Simple Text Processing

**Use Case**: Convert text to uppercase and add timestamp

```python
import datetime

# Get current timestamp
timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Process input (if connected)
processed = input_data.upper() if input_data else "NO INPUT"

# Set result
result = f"[{timestamp}] {processed}"
```

**Node Setup**:
- Enable "Use String Input"
- Connect a String Input node to provide text

---

## Example 2: JSON Data Processing

**Use Case**: Parse JSON data and extract specific fields

```python
import json

try:
    # Parse JSON input
    data = json.loads(input_data)
    
    # Extract fields
    symbol = data.get('symbol', 'UNKNOWN')
    price = data.get('price', 0)
    change = data.get('change', 0)
    
    # Format output
    result = f"{symbol}: ${price:.2f} ({change:+.2f}%)"
    
except json.JSONDecodeError:
    result = "Error: Invalid JSON input"
except Exception as e:
    result = f"Error: {str(e)}"
```

**Node Setup**:
- Enable "Use String Input"
- Connect to a node that outputs JSON data

---

## Example 3: Price Alert Formatter

**Use Case**: Format price data for Twilio alerts

```python
import datetime

# Parse input (expecting "SYMBOL:PRICE" format)
try:
    parts = input_data.split(':')
    symbol = parts[0]
    price = float(parts[1])
    
    # Get timestamp
    now = datetime.datetime.now().strftime("%H:%M:%S")
    
    # Format alert message
    result = f"""
🚨 PRICE ALERT 🚨
Symbol: {symbol}
Price: ${price:.5f}
Time: {now}
"""
    
except (IndexError, ValueError):
    result = "Error: Expected format 'SYMBOL:PRICE'"
```

**Workflow**:
```
yFinance Data → Python Script → Twilio Alert
```

---

## Example 4: Moving Average Calculator

**Use Case**: Calculate simple moving average from price list

```python
import json

try:
    # Parse price list from JSON
    prices = json.loads(input_data)
    
    # Calculate moving average
    if len(prices) > 0:
        avg = sum(prices) / len(prices)
        result = f"MA({len(prices)}): {avg:.5f}"
    else:
        result = "No prices provided"
        
except Exception as e:
    result = f"Error: {str(e)}"
```

---

## Example 5: Percentage Change Calculator

**Use Case**: Calculate percentage change between two prices

```python
# Input format: "OLD_PRICE,NEW_PRICE"
try:
    old_price, new_price = map(float, input_data.split(','))
    
    # Calculate percentage change
    change = ((new_price - old_price) / old_price) * 100
    
    # Format result with emoji
    emoji = "📈" if change > 0 else "📉" if change < 0 else "➡️"
    result = f"{emoji} Change: {change:+.2f}%"
    
except (ValueError, ZeroDivisionError):
    result = "Error: Expected format 'OLD_PRICE,NEW_PRICE'"
```

---

## Example 6: Risk Calculator

**Use Case**: Calculate position size based on risk parameters

```python
import math

# Input format: "ACCOUNT_SIZE,RISK_PERCENT,STOP_LOSS_PIPS"
try:
    account_size, risk_percent, stop_loss_pips = map(float, input_data.split(','))
    
    # Calculate risk amount
    risk_amount = account_size * (risk_percent / 100)
    
    # Calculate position size (assuming $10 per pip for standard lot)
    pip_value = 10
    position_size = risk_amount / (stop_loss_pips * pip_value)
    
    # Round to 2 decimal places
    position_size = round(position_size, 2)
    
    result = f"Position Size: {position_size} lots (Risk: ${risk_amount:.2f})"
    
except (ValueError, ZeroDivisionError):
    result = "Error: Invalid input format"
```

---

## Example 7: Text Pattern Matching

**Use Case**: Extract specific patterns from text using regex

```python
import re

# Find all email addresses in input text
email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
emails = re.findall(email_pattern, input_data)

if emails:
    result = f"Found {len(emails)} email(s): {', '.join(emails)}"
else:
    result = "No email addresses found"
```

---

## Example 8: Multi-Line Data Formatter

**Use Case**: Format scraped web data into readable format

```python
# Clean and format scraped text
lines = input_data.split('\n')

# Remove empty lines and trim whitespace
cleaned_lines = [line.strip() for line in lines if line.strip()]

# Take first 5 lines
preview = cleaned_lines[:5]

# Format result
result = "📄 Content Preview:\n" + "\n".join(f"• {line}" for line in preview)

if len(cleaned_lines) > 5:
    result += f"\n... and {len(cleaned_lines) - 5} more lines"
```

**Workflow**:
```
Firecrawl → Python Script → String Output
```

---

## Example 9: Conditional Logic

**Use Case**: Make decisions based on input data

```python
# Input: numeric value as string
try:
    value = float(input_data)
    
    if value > 100:
        result = "HIGH: Value exceeds threshold"
    elif value > 50:
        result = "MEDIUM: Value is moderate"
    else:
        result = "LOW: Value is below threshold"
        
except ValueError:
    result = "Error: Input must be a number"
```

---

## Example 10: Data Aggregation

**Use Case**: Combine multiple data points into summary

```python
import json

try:
    # Parse array of data points
    data_points = json.loads(input_data)
    
    # Calculate statistics
    total = sum(data_points)
    count = len(data_points)
    average = total / count if count > 0 else 0
    minimum = min(data_points) if data_points else 0
    maximum = max(data_points) if data_points else 0
    
    # Format summary
    result = f"""
📊 Data Summary:
Count: {count}
Total: {total:.2f}
Average: {average:.2f}
Min: {minimum:.2f}
Max: {maximum:.2f}
"""
    
except Exception as e:
    result = f"Error: {str(e)}"
```

---

## Tips for Writing Python Scripts

1. **Always handle errors**: Use try-except blocks to catch potential errors
2. **Set result variable**: Your script must set `result` for output
3. **Test with sample data**: Use the "Run Script" button to test before deploying
4. **Keep it efficient**: Avoid complex loops or heavy computations
5. **Document your code**: Add comments to explain complex logic
6. **Validate input**: Check input format before processing
7. **Use string formatting**: f-strings make output formatting easy
8. **Consider edge cases**: Handle empty inputs, zero values, etc.

## Common Patterns

### Error Handling Template
```python
try:
    # Your code here
    result = "Success"
except ValueError as e:
    result = f"Value Error: {str(e)}"
except Exception as e:
    result = f"Error: {str(e)}"
```

### Input Validation Template
```python
if not input_data or not input_data.strip():
    result = "Error: No input provided"
else:
    # Process input
    result = f"Processed: {input_data}"
```

### JSON Processing Template
```python
import json

try:
    data = json.loads(input_data)
    # Process data
    result = json.dumps(data, indent=2)
except json.JSONDecodeError:
    result = "Error: Invalid JSON"
```
