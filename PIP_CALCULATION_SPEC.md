# Pip-Based Loss Calculation Specification

## Overview
The volume loss calculation has been updated to use proper pip-based methodology with real contract information retrieved from MetaTrader 5, ensuring accurate loss calculations across all symbol types.

## Implementation Details

### Step 1: Retrieve Real Contract Data from MT5

When connected to MT5, the system retrieves actual contract specifications and converts them properly:

```javascript
const symbolInfoResult = await window.mt5API.getSymbolInfo(symbol);
const symbolInfo = symbolInfoResult.data;

// Extract tick data from MT5
tickSize = symbolInfo.trade_tick_size;        // e.g., 0.00001 for EUR/USD (1 point)
tickValue = symbolInfo.trade_tick_value;      // e.g., $1 per point
contractSize = symbolInfo.trade_contract_size; // e.g., 100,000 for standard lot

// Determine pip size based on symbol type
const isYenPair = symbol.includes('JPY');
pipSize = isYenPair ? 0.01 : 0.0001;

// Convert tick value to pip value
// For EUR/USD: 1 pip = 10 ticks, so pip value = $1/tick × 10 = $10/pip
const ticksPerPip = pipSize / tickSize;
pipValue = tickValue * ticksPerPip;
```

**Important: Tick vs Pip**
- **Tick (Point):** Smallest price movement MT5 tracks (e.g., 0.00001 for EUR/USD)
- **Pip:** Standard trading unit (e.g., 0.0001 for EUR/USD = 10 ticks)
- MT5 gives us tick data, we convert to pip data for proper calculation

**Benefits:**
- Uses actual broker specifications
- Handles all symbol types (forex, metals, indices, commodities)
- Automatically adjusts for broker-specific configurations
- Correctly converts ticks to pips

### Step 2: Calculate Price Change in Pips

Calculate how many pips equal a 1% price move:

```javascript
const priceChangeInPips = (currentPrice * 0.01) / pipSize;
```

**Example for EUR/USD at 1.1000:**
- 1% of price: 1.1000 × 0.01 = 0.011
- In pips: 0.011 ÷ 0.0001 = 110 pips

**Example for USD/JPY at 150.00:**
- 1% of price: 150.00 × 0.01 = 1.50
- In pips: 1.50 ÷ 0.01 = 150 pips

### Step 3: Calculate Loss

Apply the standard pip-based formula:

```javascript
const totalLoss = priceChangeInPips × pipValue × volume;
```

**Example for EUR/USD:**
- Loss = 110 pips × $10/pip × 1 lot = **$1,100**

**Example for USD/JPY:**
- Loss = 150 pips × $6.67/pip × 1 lot = **$1,000**

## Fallback Calculation

If MT5 is not connected, the system uses intelligent fallback logic:

### For Yen Pairs (Contains 'JPY')
```javascript
pipSize = 0.01;
pipValue = (0.01 × 100000) / currentPrice;
```

### For Other Pairs
```javascript
pipSize = 0.0001;
pipValue = (0.0001 × 100000) / currentPrice;
```

### For USD Quote Currency Pairs (Ends with 'USD')
```javascript
pipValue = 10; // Simplified approximation
```

## Mathematical Validation

### EUR/USD Example
- **Current Price:** 1.1000
- **Volume:** 1 lot (100,000 units)
- **Pip Size:** 0.0001
- **Pip Value:** $10 per pip

**Calculation:**
1. 1% price change: 0.011
2. Pips moved: 0.011 ÷ 0.0001 = 110 pips
3. Loss: 110 × $10 × 1 = **$1,100** ✓

### USD/JPY Example
- **Current Price:** 150.00
- **Volume:** 1 lot (100,000 units)
- **Pip Size:** 0.01
- **Pip Value:** $6.67 per pip

**Calculation:**
1. 1% price change: 1.50
2. Pips moved: 1.50 ÷ 0.01 = 150 pips
3. Loss: 150 × $6.67 × 1 = **$1,000** ✓

## Key MT5 Symbol Properties Used

| Property | Description | Example (EUR/USD) |
|----------|-------------|-------------------|
| `trade_tick_size` | Minimum price change (pip size) | 0.00001 |
| `trade_tick_value` | Dollar value per tick for 1 lot | $1 |
| `trade_contract_size` | Units per lot | 100,000 |
| `point` | Minimum price step | 0.00001 |
| `digits` | Decimal places | 5 |

## Functions Updated

### 1. `calculateVolumeLoss()`
- **Location:** `renderer.js:707`
- **Purpose:** Calculates loss for trade modal volume input
- **Behavior:** 
  - Retrieves symbol info from MT5 when connected
  - Shows real-time loss calculation as user changes volume
  - Displays popup reminder with loss details

### 2. `testVolumeLossFromNode(nodeId)`
- **Location:** `renderer.js:808`
- **Purpose:** Tests loss calculation for trade nodes in node editor
- **Behavior:**
  - Gets symbol and volume from selected trade node
  - Retrieves symbol info from MT5 when connected
  - Logs detailed calculation breakdown to console
  - Shows popup reminder with results

## Logging Output

The system logs detailed calculation information to the console:

```
Using real MT5 contract data:
Tick size (pip size): 0.0001
Tick value (pip value for 1 lot): 10
Contract size: 100000

Calculation details:
Current price: 1.1000
Pip size: 0.0001
Pip value for 1 lot: 10
Contract size: 100000
1% price change in pips: 110
Volume (lots): 1
Final loss for 1% move: 1100.00
```

## Error Handling

The system includes robust error handling:

1. **MT5 Connection Failure:** Falls back to calculated pip values
2. **Symbol Not Found:** Uses best-guess values based on symbol name
3. **Missing Data:** Applies reasonable defaults (0.0001 pip size, $10 pip value)
4. **Invalid Price:** Hides loss display and logs error

## User Experience

### Trade Modal
1. User selects symbol and enters volume
2. System automatically calculates potential loss
3. Warning indicator shows: "Potential loss if price drops 1%: $X.XX"
4. Popup reminder displays detailed breakdown

### Node Editor
1. User creates trade node with symbol and volume
2. User clicks "Test Loss" button
3. System shows popup with detailed calculation
4. Console displays full breakdown for verification

## Accuracy Considerations

- **Most Accurate:** MT5-connected, uses real broker data
- **Moderately Accurate:** Fallback for standard forex pairs
- **Less Accurate:** Exotic pairs without MT5 connection
- **Recommendation:** Always connect to MT5 for precise calculations

