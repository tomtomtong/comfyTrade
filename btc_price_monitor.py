"""
BTCUSD Price Monitor - Buy 0.01 BTCUSD when price falls to 105000
Standalone script that monitors BTCUSD price and executes buy order at target price
"""

import MetaTrader5 as mt5
import time
import logging
from datetime import datetime
import btc_monitor_config as config

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BTCPriceMonitor:
    def __init__(self):
        self.symbol = config.SYMBOL
        self.target_price = config.TARGET_PRICE
        self.volume = config.VOLUME
        self.connected = False
        self.order_executed = False
        self.retry_count = 0
        
    def connect_mt5(self, login=None, password=None, server=None):
        """Connect to MetaTrader 5 with retry logic"""
        # Use config values if not provided
        login = login or config.MT5_LOGIN
        password = password or config.MT5_PASSWORD
        server = server or config.MT5_SERVER
        
        while self.retry_count < config.MAX_RETRIES:
            try:
                if not mt5.initialize():
                    logger.error(f"MT5 initialization failed: {mt5.last_error()}")
                    self.retry_count += 1
                    if self.retry_count < config.MAX_RETRIES:
                        logger.info(f"Retrying connection in {config.RETRY_DELAY} seconds... ({self.retry_count}/{config.MAX_RETRIES})")
                        time.sleep(config.RETRY_DELAY)
                        continue
                    return False
                
                if login and password and server:
                    authorized = mt5.login(login, password, server)
                    if not authorized:
                        logger.error(f"MT5 login failed: {mt5.last_error()}")
                        mt5.shutdown()
                        self.retry_count += 1
                        if self.retry_count < config.MAX_RETRIES:
                            logger.info(f"Retrying connection in {config.RETRY_DELAY} seconds... ({self.retry_count}/{config.MAX_RETRIES})")
                            time.sleep(config.RETRY_DELAY)
                            continue
                        return False
                
                self.connected = True
                logger.info("✅ Connected to MT5 successfully")
                return True
                
            except Exception as e:
                logger.error(f"Connection error: {e}")
                self.retry_count += 1
                if self.retry_count < config.MAX_RETRIES:
                    logger.info(f"Retrying connection in {config.RETRY_DELAY} seconds... ({self.retry_count}/{config.MAX_RETRIES})")
                    time.sleep(config.RETRY_DELAY)
                else:
                    return False
        
        return False
    
    def check_symbol_availability(self):
        """Check if BTCUSD symbol is available and make it visible"""
        symbol_info = mt5.symbol_info(self.symbol)
        if symbol_info is None:
            logger.error(f"Symbol {self.symbol} not found")
            return False
        
        logger.info(f"Symbol info: {symbol_info.name}, visible: {symbol_info.visible}")
        
        # Make sure symbol is visible in Market Watch
        if not symbol_info.visible:
            logger.info(f"Making symbol {self.symbol} visible")
            if not mt5.symbol_select(self.symbol, True):
                logger.error(f"Failed to select {self.symbol}")
                return False
        
        return True
    
    def get_current_price(self):
        """Get current BTCUSD price"""
        tick = mt5.symbol_info_tick(self.symbol)
        if tick is None:
            logger.error(f"Failed to get tick for {self.symbol}")
            return None
        
        return {
            'bid': tick.bid,
            'ask': tick.ask,
            'time': datetime.fromtimestamp(tick.time)
        }
    
    def execute_buy_order(self):
        """Execute buy order for 0.01 BTCUSD at market price"""
        if self.order_executed:
            logger.warning("Order already executed, skipping")
            return False
        
        # Get current price
        tick = mt5.symbol_info_tick(self.symbol)
        if tick is None:
            logger.error(f"Failed to get current price for {self.symbol}")
            return False
        
        price = tick.ask  # Use ask price for buy order
        
        # Prepare order request
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": self.symbol,
            "volume": self.volume,
            "type": mt5.ORDER_TYPE_BUY,
            "price": price,
            "deviation": config.DEVIATION,
            "magic": config.MAGIC_NUMBER,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        logger.info(f"Executing BUY order: {self.volume} {self.symbol} at {price}")
        result = mt5.order_send(request)
        
        if result is None:
            logger.error("Order send returned None - Check MT5 connection and trading permissions")
            return False
        
        logger.info(f"Order result: retcode={result.retcode}, comment={result.comment}")
        
        # Check if order was successful
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error(f"Order failed: {result.comment} (retcode: {result.retcode})")
            return False
        
        logger.info(f"✅ ORDER EXECUTED SUCCESSFULLY!")
        logger.info(f"   Ticket: {result.order}")
        logger.info(f"   Price: {result.price}")
        logger.info(f"   Volume: {self.volume} {self.symbol}")
        
        self.order_executed = True
        return True
    
    def monitor_price(self, check_interval=5):
        """Monitor BTCUSD price and execute order when target is reached"""
        logger.info(f"🎯 Starting price monitor for {self.symbol}")
        logger.info(f"   Target price: {self.target_price}")
        logger.info(f"   Order volume: {self.volume}")
        logger.info(f"   Check interval: {check_interval} seconds")
        logger.info("   Press Ctrl+C to stop monitoring")
        
        try:
            while not self.order_executed:
                price_data = self.get_current_price()
                
                if price_data is None:
                    logger.warning("Failed to get price data, retrying...")
                    time.sleep(check_interval)
                    continue
                
                current_price = price_data['ask']  # Use ask price for comparison
                
                logger.info(f"💰 Current {self.symbol} price: {current_price} (Target: {self.target_price})")
                
                # Check if price has fallen to or below target
                if current_price <= self.target_price:
                    logger.info(f"🚨 TARGET PRICE REACHED! {current_price} <= {self.target_price}")
                    
                    if self.execute_buy_order():
                        logger.info("✅ Monitoring complete - Order executed successfully!")
                        break
                    else:
                        logger.error("❌ Order execution failed, continuing monitoring...")
                
                time.sleep(check_interval)
                
        except KeyboardInterrupt:
            logger.info("⏹️  Monitoring stopped by user")
        except Exception as e:
            logger.error(f"❌ Error during monitoring: {e}")
    
    def get_account_info(self):
        """Display current account information"""
        if not self.connected:
            logger.error("Not connected to MT5")
            return
        
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("Failed to get account info")
            return
        
        logger.info("📊 Account Information:")
        logger.info(f"   Balance: {account_info.balance} {account_info.currency}")
        logger.info(f"   Equity: {account_info.equity} {account_info.currency}")
        logger.info(f"   Free Margin: {account_info.margin_free} {account_info.currency}")
        logger.info(f"   Leverage: 1:{account_info.leverage}")
    
    def shutdown(self):
        """Shutdown MT5 connection"""
        if self.connected:
            mt5.shutdown()
            logger.info("MT5 connection closed")

def main():
    """Main function to run the price monitor"""
    monitor = BTCPriceMonitor()
    
    try:
        # Connect to MT5
        logger.info("🔌 Connecting to MetaTrader 5...")
        if not monitor.connect_mt5():
            logger.error("❌ Failed to connect to MT5")
            return
        
        # Check symbol availability
        logger.info(f"🔍 Checking {monitor.symbol} availability...")
        if not monitor.check_symbol_availability():
            logger.error(f"❌ Symbol {monitor.symbol} not available")
            return
        
        # Display account info
        monitor.get_account_info()
        
        # Start monitoring
        monitor.monitor_price(check_interval=config.CHECK_INTERVAL)
        
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
    finally:
        monitor.shutdown()

if __name__ == "__main__":
    main()