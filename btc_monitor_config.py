"""
Configuration file for BTCUSD Price Monitor
Modify these settings as needed
"""

# Trading Parameters
SYMBOL = "BTCUSD"           # Symbol to monitor
TARGET_PRICE = 105000.0     # Price level to trigger buy order
VOLUME = 0.01               # Order volume (lot size)
CHECK_INTERVAL = 5          # Price check interval in seconds

# MT5 Connection (optional - leave None to use current MT5 connection)
MT5_LOGIN = None            # Your MT5 account number
MT5_PASSWORD = None         # Your MT5 password  
MT5_SERVER = None           # Your MT5 server name

# Order Parameters
DEVIATION = 20              # Price deviation in points
MAGIC_NUMBER = 234000       # Magic number for order identification

# Logging
LOG_FILE = "btc_monitor.log"
LOG_LEVEL = "INFO"          # DEBUG, INFO, WARNING, ERROR

# Safety Settings
MAX_RETRIES = 3             # Maximum connection retry attempts
RETRY_DELAY = 10            # Delay between retries in seconds