"""
Standalone script to fetch XAUUSD (Gold) data from MetaTrader 5
and create a 6-month daily chart visualization.
"""

import MetaTrader5 as mt5
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib import style
import sys

# Set style for better-looking charts
style.use('dark_background')

def connect_mt5(login=None, password=None, server=None):
    """
    Connect to MetaTrader 5
    
    Args:
        login: MT5 account login (optional, will use default if not provided)
        password: MT5 account password (optional)
        server: MT5 server name (optional)
    
    Returns:
        bool: True if connected successfully, False otherwise
    """
    # Initialize MT5
    if not mt5.initialize():
        print("❌ MT5 initialization failed")
        print(f"   Error: {mt5.last_error()}")
        return False
    
    # If credentials provided, login
    if login and password and server:
        authorized = mt5.login(login, password=password, server=server)
        if not authorized:
            print(f"❌ MT5 login failed: {mt5.last_error()}")
            mt5.shutdown()
            return False
        print(f"✅ Connected to MT5 account: {login} on {server}")
    else:
        print("✅ Connected to MT5 (using default account)")
    
    return True

def fetch_xauusd_data(months=6):
    """
    Fetch XAUUSD historical data for the specified number of months
    
    Args:
        months: Number of months of data to fetch (default: 6)
    
    Returns:
        tuple: (rates array, error message if any)
    """
    symbol = "XAUUSD"
    
    # Check if symbol exists
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        return None, f"Symbol {symbol} not found in MT5"
    
    # If symbol is not visible, enable it
    if not symbol_info.visible:
        if not mt5.symbol_select(symbol, True):
            return None, f"Failed to select symbol {symbol}"
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)  # Approximate 30 days per month
    
    print(f"📊 Fetching {symbol} data from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    # Fetch daily (D1) data
    rates = mt5.copy_rates_range(symbol, mt5.TIMEFRAME_D1, start_date, end_date)
    
    if rates is None or len(rates) == 0:
        return None, f"No data available for {symbol} in the specified date range"
    
    print(f"✅ Fetched {len(rates)} data points")
    return rates, None

def create_chart(rates, output_file="xauusd_6month_chart.png"):
    """
    Create a 6-month chart visualization of XAUUSD data
    
    Args:
        rates: NumPy array of MT5 rates
        output_file: Output filename for the chart
    """
    # Extract data
    times = [datetime.fromtimestamp(rate['time']) for rate in rates]
    opens = [rate['open'] for rate in rates]
    highs = [rate['high'] for rate in rates]
    lows = [rate['low'] for rate in rates]
    closes = [rate['close'] for rate in rates]
    volumes = [rate['tick_volume'] for rate in rates]
    
    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), 
                                    gridspec_kw={'height_ratios': [3, 1]},
                                    facecolor='#1e1e1e')
    
    # Main price chart
    ax1.set_facecolor('#1e1e1e')
    ax1.plot(times, closes, label='Close Price', color='#FFD700', linewidth=2, alpha=0.9)
    ax1.plot(times, highs, label='High', color='#4CAF50', linewidth=1, alpha=0.5, linestyle='--')
    ax1.plot(times, lows, label='Low', color='#f44336', linewidth=1, alpha=0.5, linestyle='--')
    
    # Fill area under close price
    ax1.fill_between(times, closes, alpha=0.2, color='#FFD700')
    
    # Add current price annotation
    current_price = closes[-1]
    ax1.axhline(y=current_price, color='#888', linestyle=':', linewidth=1, alpha=0.5)
    ax1.annotate(f'Current: ${current_price:.2f}', 
                xy=(times[-1], current_price),
                xytext=(10, 10), textcoords='offset points',
                bbox=dict(boxstyle='round,pad=0.5', facecolor='#FFD700', alpha=0.8),
                fontsize=10, fontweight='bold', color='#000')
    
    # Calculate and display price change
    price_change = closes[-1] - closes[0]
    price_change_pct = (price_change / closes[0]) * 100
    color_change = '#4CAF50' if price_change >= 0 else '#f44336'
    sign = '+' if price_change >= 0 else ''
    
    ax1.text(0.02, 0.98, 
            f'6-Month Change: {sign}${price_change:.2f} ({sign}{price_change_pct:.2f}%)',
            transform=ax1.transAxes,
            fontsize=12, fontweight='bold',
            color=color_change,
            verticalalignment='top',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='#2e2e2e', alpha=0.8))
    
    # Formatting
    ax1.set_title('XAUUSD (Gold) - 6 Month Daily Chart', 
                  fontsize=16, fontweight='bold', color='#FFD700', pad=20)
    ax1.set_ylabel('Price (USD)', fontsize=12, color='#e0e0e0')
    ax1.legend(loc='upper left', facecolor='#2e2e2e', edgecolor='#444', labelcolor='#e0e0e0')
    ax1.grid(True, alpha=0.3, color='#444')
    ax1.spines['bottom'].set_color('#444')
    ax1.spines['top'].set_color('#444')
    ax1.spines['right'].set_color('#444')
    ax1.spines['left'].set_color('#444')
    ax1.tick_params(colors='#888')
    
    # Format x-axis dates
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
    ax1.xaxis.set_major_locator(mdates.WeekdayLocator(interval=2))
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    # Volume chart
    ax2.set_facecolor('#1e1e1e')
    ax2.bar(times, volumes, color='#666', alpha=0.6, width=0.8)
    ax2.set_ylabel('Volume', fontsize=10, color='#e0e0e0')
    ax2.set_xlabel('Date', fontsize=12, color='#e0e0e0')
    ax2.grid(True, alpha=0.2, color='#444', axis='y')
    ax2.spines['bottom'].set_color('#444')
    ax2.spines['top'].set_color('#444')
    ax2.spines['right'].set_color('#444')
    ax2.spines['left'].set_color('#444')
    ax2.tick_params(colors='#888')
    
    # Format x-axis dates for volume chart
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
    ax2.xaxis.set_major_locator(mdates.WeekdayLocator(interval=2))
    plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    # Adjust layout
    plt.tight_layout()
    
    # Save chart
    plt.savefig(output_file, dpi=300, facecolor='#1e1e1e', bbox_inches='tight')
    print(f"✅ Chart saved as: {output_file}")
    
    # Show chart
    plt.show()

def main():
    """Main function"""
    print("=" * 60)
    print("XAUUSD 6-Month Chart Generator")
    print("=" * 60)
    print()
    
    # Connect to MT5
    # You can optionally provide login credentials:
    # if not connect_mt5(login=YOUR_LOGIN, password=YOUR_PASSWORD, server=YOUR_SERVER):
    if not connect_mt5():
        print("\n💡 Tip: Make sure MetaTrader 5 is running and logged in.")
        print("   You can also provide credentials in the connect_mt5() call.")
        sys.exit(1)
    
    try:
        # Fetch data
        rates, error = fetch_xauusd_data(months=6)
        
        if error:
            print(f"❌ Error: {error}")
            sys.exit(1)
        
        # Create chart
        create_chart(rates)
        
        print("\n✅ Chart generation completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        # Shutdown MT5 connection
        mt5.shutdown()
        print("\n🔌 Disconnected from MT5")

if __name__ == "__main__":
    main()

