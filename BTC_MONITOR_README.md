# BTCUSD Price Monitor

Automatically buy 0.01 BTCUSD when the price falls to 105000.

## Quick Start

1. **Install Requirements**
   ```bash
   pip install MetaTrader5
   ```

2. **Configure Settings**
   Edit `btc_monitor_config.py` to customize:
   - Target price (default: 105000)
   - Volume (default: 0.01)
   - Check interval (default: 5 seconds)
   - MT5 login credentials (optional)

3. **Run the Monitor**
   ```bash
   python btc_price_monitor.py
   ```

## Configuration Options

### Trading Parameters
- `SYMBOL`: Symbol to monitor (default: "BTCUSD")
- `TARGET_PRICE`: Price level to trigger buy order (default: 105000.0)
- `VOLUME`: Order volume in lots (default: 0.01)
- `CHECK_INTERVAL`: Price check frequency in seconds (default: 5)

### MT5 Connection
- `MT5_LOGIN`: Your MT5 account number (optional)
- `MT5_PASSWORD`: Your MT5 password (optional)
- `MT5_SERVER`: Your MT5 server name (optional)

If login credentials are not provided, the script will use your currently logged-in MT5 terminal.

## How It Works

1. **Connection**: Connects to your MT5 terminal
2. **Symbol Check**: Verifies BTCUSD is available and makes it visible
3. **Price Monitoring**: Continuously checks current ask price every 5 seconds
4. **Order Execution**: When price ≤ 105000, executes market buy order for 0.01 lots
5. **Completion**: Stops monitoring after successful order execution

## Output Example

```
2024-01-15 10:30:00 - INFO - 🔌 Connecting to MetaTrader 5...
2024-01-15 10:30:01 - INFO - ✅ Connected to MT5 successfully
2024-01-15 10:30:01 - INFO - 🔍 Checking BTCUSD availability...
2024-01-15 10:30:01 - INFO - 📊 Account Information:
2024-01-15 10:30:01 - INFO -    Balance: 10000.00 USD
2024-01-15 10:30:01 - INFO - 🎯 Starting price monitor for BTCUSD
2024-01-15 10:30:01 - INFO -    Target price: 105000.0
2024-01-15 10:30:01 - INFO -    Order volume: 0.01
2024-01-15 10:30:06 - INFO - 💰 Current BTCUSD price: 106500.0 (Target: 105000.0)
2024-01-15 10:30:11 - INFO - 💰 Current BTCUSD price: 105200.0 (Target: 105000.0)
2024-01-15 10:30:16 - INFO - 💰 Current BTCUSD price: 104950.0 (Target: 105000.0)
2024-01-15 10:30:16 - INFO - 🚨 TARGET PRICE REACHED! 104950.0 <= 105000.0
2024-01-15 10:30:16 - INFO - ✅ ORDER EXECUTED SUCCESSFULLY!
2024-01-15 10:30:16 - INFO -    Ticket: 123456789
2024-01-15 10:30:16 - INFO -    Price: 104950.0
2024-01-15 10:30:16 - INFO - ✅ Monitoring complete - Order executed successfully!
```

## Safety Features

- **Single Execution**: Order executes only once, then monitoring stops
- **Error Handling**: Robust error handling with retry logic
- **Logging**: All activities logged to file and console
- **Connection Retry**: Automatic reconnection attempts if MT5 connection fails

## Requirements

- MetaTrader 5 terminal installed and running
- Python 3.7+
- MetaTrader5 Python package
- Active MT5 account with sufficient balance
- BTCUSD symbol available in your broker

## Stopping the Monitor

Press `Ctrl+C` to stop monitoring at any time.

## Log Files

All activity is logged to `btc_monitor.log` for review and debugging.