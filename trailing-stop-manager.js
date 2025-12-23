/**
 * Trailing Stop Loss Manager
 * Automatically adjusts SL and TP for positions every 5 minutes
 * Supports trailing SL only with fixed TP
 */

class TrailingStopManager {
  constructor() {
    this.trailingPositions = new Map(); // ticket -> {settings, lastPrice, lastAdjustment}
    this.intervalId = null;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.loadSettings();
    this.start();
  }

  /**
   * Load trailing settings from app_settings.json via SettingsManager
   */
  async loadSettings() {
    try {
      if (window.settingsManager) {
        const trailingData = window.settingsManager.get('trailing_stops') || {};
        
        // Restore trailing positions
        if (trailingData.positions && Array.isArray(trailingData.positions)) {
          trailingData.positions.forEach(pos => {
            this.trailingPositions.set(pos.ticket, {
              ticket: pos.ticket,
              slDistance: pos.slDistance || 0, // Distance in price units
              slDistancePercent: pos.slDistancePercent || 0, // Distance as percentage
              tpDistance: pos.tpDistance || 0, // Distance in price units
              tpDistancePercent: pos.tpDistancePercent || 0, // Distance as percentage
              triggerPrice: pos.triggerPrice || 0, // Price at which trailing activates (0 = immediate)
              fixedTP: pos.fixedTP || null, // Fixed TP value (null means TP trails with SL)
              trailSLOnly: pos.trailSLOnly || false, // If true, only SL trails, TP stays fixed
              lastPrice: pos.lastPrice || 0,
              lastAdjustment: pos.lastAdjustment || new Date().toISOString(),
              enabled: true
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading trailing stop settings:', error);
    }
  }

  /**
   * Save trailing settings to app_settings.json via SettingsManager
   */
  async saveSettings() {
    try {
      if (window.settingsManager) {
        await window.settingsManager.set('trailing_stops', {
          positions: Array.from(this.trailingPositions.values()).map(pos => ({
            ticket: pos.ticket,
            slDistance: pos.slDistance,
            slDistancePercent: pos.slDistancePercent,
            tpDistance: pos.tpDistance,
            tpDistancePercent: pos.tpDistancePercent,
            triggerPrice: pos.triggerPrice || 0,
            fixedTP: pos.fixedTP || null,
            trailSLOnly: pos.trailSLOnly || false,
            lastPrice: pos.lastPrice,
            lastAdjustment: pos.lastAdjustment
          })),
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error saving trailing stop settings:', error);
    }
  }

  /**
   * Enable trailing stop for a position
   */
  async enableTrailing(ticket, settings) {
    // Get current position to capture fixed TP if needed
    let fixedTP = null;
    if (settings.trailSLOnly && window.mt5API && window.isConnected) {
      try {
        const result = await window.mt5API.getPositions();
        if (result.success && result.data) {
          const position = result.data.find(p => p.ticket === ticket);
          if (position) {
            fixedTP = position.take_profit || position.takeProfit || 0;
            console.log(`Trailing: Storing fixed TP ${fixedTP} for ticket ${ticket}`);
          }
        }
      } catch (error) {
        console.error('Error getting position for fixed TP:', error);
      }
    }
    
    const position = {
      ticket: ticket,
      slDistance: settings.slDistance || 0,
      slDistancePercent: settings.slDistancePercent || 0,
      tpDistance: settings.tpDistance || 0,
      tpDistancePercent: settings.tpDistancePercent || 0,
      triggerPrice: settings.triggerPrice || 0, // 0 means activate immediately
      fixedTP: fixedTP, // Fixed TP value (null means TP trails with SL)
      trailSLOnly: settings.trailSLOnly || false, // If true, only SL trails, TP stays fixed
      lastPrice: settings.initialPrice || 0,
      lastAdjustment: new Date().toISOString(),
      enabled: true
    };
    
    this.trailingPositions.set(ticket, position);
    await this.saveSettings();
    
    return { success: true, message: 'Trailing stop enabled' };
  }

  /**
   * Disable trailing stop for a position
   */
  async disableTrailing(ticket) {
    if (this.trailingPositions.has(ticket)) {
      this.trailingPositions.delete(ticket);
      await this.saveSettings();
      return { success: true, message: 'Trailing stop disabled' };
    }
    return { success: false, message: 'Trailing stop not found' };
  }

  /**
   * Check if trailing is enabled for a position
   */
  isTrailingEnabled(ticket) {
    return this.trailingPositions.has(ticket);
  }

  /**
   * Get trailing settings for a position
   */
  getTrailingSettings(ticket) {
    return this.trailingPositions.get(ticket) || null;
  }

  /**
   * Get all trailing positions
   */
  getAllTrailingPositions() {
    return Array.from(this.trailingPositions.keys());
  }

  /**
   * Calculate new SL and TP based on current price and position type
   */
  calculateNewSLTP(position, currentPrice) {
    const trailing = this.trailingPositions.get(position.ticket);
    console.log('Trailing: calculateNewSLTP for ticket', position.ticket, 'trailing config:', trailing);
    
    if (!trailing || !trailing.enabled) {
      console.warn('Trailing: No trailing config or not enabled for ticket', position.ticket);
      return null;
    }

    const isBuy = position.type === 'BUY';
    
    // Check if trigger price has been reached
    const triggerPrice = trailing.triggerPrice || 0;
    if (triggerPrice > 0) {
      const triggerReached = isBuy 
        ? currentPrice >= triggerPrice  // For BUY: activate when price reaches or exceeds trigger
        : currentPrice <= triggerPrice; // For SELL: activate when price reaches or falls below trigger
      
      if (!triggerReached) {
        console.log(`Trailing: Trigger price not reached for ticket ${position.ticket}. Current: ${currentPrice}, Trigger: ${triggerPrice}`);
        return null; // Don't activate trailing yet
      } else {
        console.log(`Trailing: Trigger price reached for ticket ${position.ticket}. Current: ${currentPrice}, Trigger: ${triggerPrice}`);
      }
    }
    // Handle both property name formats (stop_loss/stopLoss)
    const currentSL = position.stop_loss || position.stopLoss || 0;
    const currentTP = position.take_profit || position.takeProfit || 0;
    let newSL = currentSL;
    let newTP = currentTP;

    // Check if we should only trail SL and keep TP fixed
    const trailSLOnly = trailing.trailSLOnly || false;
    const fixedTP = trailing.fixedTP;

    // Calculate SL distance (use percentage if provided, otherwise absolute)
    let slDistance = trailing.slDistance;
    if (trailing.slDistancePercent > 0) {
      slDistance = currentPrice * (trailing.slDistancePercent / 100);
    }

    // Calculate TP distance (only if not using fixed TP)
    let tpDistance = 0;
    if (!trailSLOnly) {
      tpDistance = trailing.tpDistance;
      if (trailing.tpDistancePercent > 0) {
        tpDistance = currentPrice * (trailing.tpDistancePercent / 100);
      }
    }

    console.log('Trailing: Distances - SL:', slDistance, 'TP:', tpDistance, 'current price:', currentPrice);
    console.log('Trailing: trailSLOnly:', trailSLOnly, 'fixedTP:', fixedTP);

    // Calculate new SL (always trailing if distance is set)
    if (slDistance > 0) {
      if (isBuy) {
        // BUY: SL moves up as price increases (never down)
        newSL = currentPrice - slDistance;
        // Only move SL up, never down
        if (newSL < currentSL) {
          newSL = currentSL;
        }
      } else {
        // SELL: SL moves down as price decreases (never up)
        newSL = currentPrice + slDistance;
        // Only move SL down, never up
        if (newSL > currentSL) {
          newSL = currentSL;
        }
      }
    }

    // Calculate new TP
    if (trailSLOnly) {
      // Use fixed TP value if stored, otherwise use current TP (which becomes the fixed value)
      if (fixedTP !== null && fixedTP > 0) {
        newTP = fixedTP;
        console.log('Trailing: Using fixed TP:', fixedTP);
      } else {
        // If fixedTP wasn't captured, use current TP and store it as fixed
        newTP = currentTP;
        trailing.fixedTP = currentTP;
        console.log('Trailing: Storing current TP as fixed TP:', currentTP);
      }
    } else if (tpDistance > 0) {
      // Calculate trailing TP
      if (isBuy) {
        newTP = currentPrice + tpDistance;
      } else {
        newTP = currentPrice - tpDistance;
      }
    } else {
      // Keep current TP
      newTP = currentTP;
    }

    // Update last price
    trailing.lastPrice = currentPrice;
    trailing.lastAdjustment = new Date().toISOString();

    // If SL distance is not set and we're not using fixed TP, nothing to do
    if (slDistance <= 0 && (trailSLOnly ? (fixedTP === null || fixedTP <= 0) : tpDistance <= 0)) {
      console.log('Trailing: No valid distance set for ticket', position.ticket);
      return null;
    }

    // Only update if SL actually changed (for trailing SL only mode)
    if (trailSLOnly && newSL === currentSL) {
      console.log('Trailing: SL unchanged for ticket', position.ticket, 'current SL:', currentSL, 'new SL:', newSL);
      return null; // No need to modify if SL hasn't changed
    }

    console.log('Trailing: Will update ticket', position.ticket, 'to SL:', newSL, 'TP:', newTP);
    return {
      ticket: position.ticket,
      stopLoss: newSL,
      takeProfit: newTP,
      currentPrice: currentPrice
    };
  }

  /**
   * Adjust SL/TP for all trailing positions
   */
  async adjustAllPositions() {
    // Use global isConnected flag from renderer instead of mt5API.isConnected()
    // Default to false if window.isConnected is undefined (renderer.js not loaded yet)
    const isConnected = window.isConnected !== undefined ? window.isConnected : false;
    console.log('Trailing: Checking connection... isConnected =', isConnected, 'mt5API =', !!window.mt5API);
    
    if (!window.mt5API || !isConnected) {
      console.warn('Trailing: Not connected to MT5. isConnected:', isConnected, 'mt5API:', !!window.mt5API);
      return { adjusted: 0, failed: ['Not connected to MT5'] };
    }

    try {
      // Get all open positions
      console.log('Trailing: Fetching positions...');
      const result = await window.mt5API.getPositions();
      console.log('Trailing: Positions result:', result.success, 'data length:', result.data?.length);
      
      if (!result.success || !result.data) {
        return { adjusted: 0, failed: ['Failed to get positions'] };
      }

      const positions = result.data;
      const trailingTickets = this.getAllTrailingPositions();
      console.log('Trailing: Found', positions.length, 'positions,', trailingTickets.length, 'have trailing enabled:', trailingTickets);
      let adjustedCount = 0;
      const failed = [];

      for (const position of positions) {
        if (trailingTickets.includes(position.ticket)) {
          console.log('Trailing: Processing position ticket', position.ticket, 'current price:', position.current_price);
          const adjustment = this.calculateNewSLTP(position, position.current_price);
          console.log('Trailing: Adjustment calculated:', adjustment);
          
          if (adjustment) {
            try {
              // Modify position with new SL/TP
              const modifyResult = await window.mt5API.modifyPosition(
                adjustment.ticket,
                adjustment.stopLoss,
                adjustment.takeProfit
              );

              if (modifyResult.success && modifyResult.data.success) {
                console.log(`Trailing stop adjusted for ticket ${adjustment.ticket}: SL=${adjustment.stopLoss.toFixed(5)}, TP=${adjustment.takeProfit.toFixed(5)}`);
                adjustedCount += 1;
              } else {
                const msg = modifyResult.data?.error || modifyResult.error || 'Unknown error';
                console.warn(`Failed to adjust trailing stop for ticket ${adjustment.ticket}:`, msg);
                failed.push(`Ticket ${adjustment.ticket}: ${msg}`);
                if (typeof showMessage === 'function') {
                  showMessage(`Failed to adjust trailing stop for ticket ${adjustment.ticket}: ${msg}`, 'error');
                }
              }
            } catch (error) {
              console.error(`Error adjusting trailing stop for ticket ${adjustment.ticket}:`, error);
              failed.push(`Ticket ${adjustment.ticket}: ${error.message || error}`);
              if (typeof showMessage === 'function') {
                showMessage(`Error adjusting trailing stop for ticket ${adjustment.ticket}: ${error.message || error}`, 'error');
              }
            }
          }
        }
      }

      // Save updated settings
      await this.saveSettings();
      return { adjusted: adjustedCount, failed };
    } catch (error) {
      console.error('Error adjusting trailing positions:', error);
      return { adjusted: 0, failed: [error.message || String(error)] };
    }
  }

  /**
   * Start the trailing stop adjustment interval
   */
  async start() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Load settings first
    await this.loadSettings();

    // Run immediately on start, then every 5 minutes
    this.adjustAllPositions();
    this.intervalId = setInterval(() => {
      this.adjustAllPositions();
    }, this.updateInterval);

    console.log('Trailing stop manager started (updates every 5 minutes)');
  }

  /**
   * Stop the trailing stop adjustment interval
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Trailing stop manager stopped');
    }
  }

  /**
   * Clean up trailing positions that no longer exist
   */
  async cleanup() {
    // Use global isConnected flag from renderer instead of mt5API.isConnected()
    // Default to false if window.isConnected is undefined (renderer.js not loaded yet)
    const isConnected = window.isConnected !== undefined ? window.isConnected : false;
    if (!window.mt5API || !isConnected) {
      return;
    }

    try {
      const result = await window.mt5API.getPositions();
      if (result.success && result.data) {
        const openTickets = result.data.map(p => p.ticket);
        const trailingTickets = Array.from(this.trailingPositions.keys());
        
        trailingTickets.forEach(ticket => {
          if (!openTickets.includes(ticket)) {
            this.trailingPositions.delete(ticket);
            console.log(`Removed trailing stop for closed position ${ticket}`);
          }
        });
        
        await this.saveSettings();
      }
    } catch (error) {
      console.error('Error cleaning up trailing positions:', error);
    }
  }
}

// Initialize trailing stop manager when settings manager is ready
if (typeof window !== 'undefined') {
  // Wait for settings manager to be available
  function initTrailingManager() {
    if (window.settingsManager) {
      window.trailingStopManager = new TrailingStopManager();
      
      // Clean up when positions are refreshed
      const originalRefresh = window.handleRefreshPositions;
      if (originalRefresh) {
        window.handleRefreshPositions = async function() {
          await originalRefresh();
          if (window.trailingStopManager) {
            await window.trailingStopManager.cleanup();
          }
        };
      }
    } else {
      // Retry after a short delay
      setTimeout(initTrailingManager, 100);
    }
  }
  
  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrailingManager);
  } else {
    initTrailingManager();
  }
}

