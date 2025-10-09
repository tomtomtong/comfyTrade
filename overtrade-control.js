// Overtrade Control System - Reminder-based (non-blocking)
class OvertradeControl {
  constructor() {
    this.settings = {
      enabled: true,
      maxTrades: 5,
      timePeriod: 'hour', // minute, hour, day, week
      reminderFrequency: 'first', // every, first, periodic
      applyToManual: true,
      applyToStrategy: true,
      applyToNodes: true
    };
    
    this.tradeHistory = [];
    this.lastWarningTime = null;
    this.warningCount = 0;
    this.cachedOpenPositionsCount = 0;
    
    this.loadSettings();
    this.setupEventListeners();
    this.startPeriodicCleanup();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('overtradeSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
      
      const history = localStorage.getItem('overtradeHistory');
      if (history) {
        this.tradeHistory = JSON.parse(history);
        this.cleanupOldTrades();
      }
      
      // Load last warning time
      const lastWarning = localStorage.getItem('overtradeLastWarning');
      if (lastWarning) {
        this.lastWarningTime = parseInt(lastWarning);
      }
      
      // Load warning count
      const warningCount = localStorage.getItem('overtradeWarningCount');
      if (warningCount) {
        this.warningCount = parseInt(warningCount);
      }
      
      console.log('Overtrade control loaded:', {
        settings: this.settings,
        tradeCount: this.tradeHistory.length,
        lastWarning: this.lastWarningTime ? new Date(this.lastWarningTime).toLocaleString() : 'Never'
      });
    } catch (error) {
      console.error('Error loading overtrade settings:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('overtradeSettings', JSON.stringify(this.settings));
      localStorage.setItem('overtradeHistory', JSON.stringify(this.tradeHistory));
      localStorage.setItem('overtradeLastWarning', this.lastWarningTime ? this.lastWarningTime.toString() : '0');
      localStorage.setItem('overtradeWarningCount', this.warningCount.toString());
      
      console.log('Overtrade data saved:', {
        tradeCount: this.tradeHistory.length,
        settings: this.settings
      });
    } catch (error) {
      console.error('Error saving overtrade settings:', error);
    }
  }

  setupEventListeners() {
    // Warning modal controls
    document.getElementById('proceedTradeBtn').addEventListener('click', () => this.proceedWithTrade());
    document.getElementById('cancelTradeFromWarningBtn').addEventListener('click', () => this.cancelTradeFromWarning());
    document.getElementById('disableRemindersBtn').addEventListener('click', () => this.disableReminders());
  }

  getTimePeriodMs() {
    const periods = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };
    return periods[this.settings.timePeriod] || periods.hour;
  }

  cleanupOldTrades() {
    const cutoffTime = Date.now() - this.getTimePeriodMs();
    this.tradeHistory = this.tradeHistory.filter(trade => trade.timestamp > cutoffTime);
  }

  getCurrentPeriodTrades() {
    // For open positions mode, we need to get current open positions from MT5
    // This method will be called synchronously, so we'll use cached data
    return this.cachedOpenPositionsCount || 0;
  }

  async getCurrentOpenPositions() {
    // Get current open positions from MT5
    try {
      if (window.mt5Bridge && window.mt5Bridge.isConnected()) {
        const positions = await window.mt5Bridge.getPositions();
        this.cachedOpenPositionsCount = positions ? positions.length : 0;
        return this.cachedOpenPositionsCount;
      } else {
        // If not connected to MT5, fall back to 0
        this.cachedOpenPositionsCount = 0;
        return 0;
      }
    } catch (error) {
      console.error('Error getting open positions:', error);
      this.cachedOpenPositionsCount = 0;
      return 0;
    }
  }

  async shouldShowReminder(tradeType) {
    if (!this.settings.enabled) return false;
    
    // Check if this trade type should trigger reminders
    const typeMap = {
      manual: this.settings.applyToManual,
      strategy: this.settings.applyToStrategy,
      node: this.settings.applyToNodes
    };
    
    if (!typeMap[tradeType]) return false;
    
    // Get current open positions count
    const currentOpenPositions = await this.getCurrentOpenPositions();
    
    // Check if we've reached the threshold
    if (currentOpenPositions < this.settings.maxTrades) return false;
    
    // Check reminder frequency
    switch (this.settings.reminderFrequency) {
      case 'every':
        return true;
      case 'first':
        return !this.lastWarningTime || (Date.now() - this.lastWarningTime) > this.getTimePeriodMs();
      case 'periodic':
        return (currentOpenPositions - this.settings.maxTrades) % 3 === 0;
      default:
        return true;
    }
  }

  recordTrade(tradeType, tradeData = {}) {
    // Only record trades that open new positions
    const isNewPosition = this.isNewPositionTrade(tradeData);
    
    if (!isNewPosition) {
      console.log('Trade not recorded - not a new position:', {
        type: tradeType,
        action: tradeData.action || 'unknown',
        data: tradeData
      });
      return;
    }
    
    const trade = {
      timestamp: Date.now(),
      type: tradeType,
      data: tradeData,
      action: tradeData.action || 'new_position'
    };
    
    this.tradeHistory.push(trade);
    
    // Save immediately after recording trade
    this.saveSettings();
    
    // Update display
    this.updateStatusDisplay();
    
    console.log('New position trade recorded:', {
      type: tradeType,
      action: trade.action,
      totalNewPositions: this.tradeHistory.length,
      currentPeriodNewPositions: this.getCurrentPeriodTrades()
    });
  }

  isNewPositionTrade(tradeData) {
    // Check if this is a new position trade vs position management
    const action = tradeData.action;
    
    // Explicitly exclude position management actions
    if (action === 'closePosition' || action === 'modifyPosition') {
      return false;
    }
    
    // Include new position actions
    if (action === 'executeOrder' || action === 'executeStrategy' || action === 'executeNodeStrategy') {
      return true;
    }
    
    // For manual trades and other cases, assume it's a new position unless specified otherwise
    // This maintains backward compatibility
    return true;
  }

  async checkAndShowReminder(tradeType, tradeData = {}) {
    return new Promise(async (resolve) => {
      const shouldShow = await this.shouldShowReminder(tradeType);
      if (shouldShow) {
        this.pendingTradeResolve = resolve;
        this.pendingTradeData = { type: tradeType, data: tradeData };
        this.showWarningModal();
      } else {
        // Record the trade and proceed
        this.recordTrade(tradeType, tradeData);
        resolve(true);
      }
    });
  }

  showConfigModal() {
    // Redirect to settings modal with overtrade control tab
    if (typeof showSettingsModal === 'function') {
      showSettingsModal();
      // Switch to overtrade control tab after a short delay
      setTimeout(() => {
        if (typeof switchSettingsTab === 'function') {
          switchSettingsTab('overtradeControl');
        }
      }, 100);
    }
  }

  hideConfigModal() {
    // This method is kept for compatibility but no longer needed
    console.log('hideConfigModal called - now handled by settings modal');
  }

  async showWarningModal() {
    const currentOpenPositions = await this.getCurrentOpenPositions();
    
    // Show immediate popup notification
    this.showOvertradePopup(currentOpenPositions);
    
    document.getElementById('warningTradeCount').textContent = currentOpenPositions;
    document.getElementById('warningTimePeriod').textContent = 'open positions';
    document.getElementById('warningFrequency').textContent = `${currentOpenPositions} open positions`;
    document.getElementById('warningPeriodStart').textContent = 'Current';
    document.getElementById('warningNextReset').textContent = 'When positions close';
    
    document.getElementById('overtradeWarningModal').classList.add('show');
  }

  showOvertradePopup(currentOpenPositions) {
    // Update the persistent panel instead of showing popup
    this.updatePersistentPanel(currentOpenPositions);
    
    // Show message notification for immediate feedback
    const alertMessage = `⚠️ Open Position Alert: ${currentOpenPositions} open positions!`;
    
    if (typeof showMessage === 'function') {
      showMessage(alertMessage, 'error');
      
      // Show additional popup after a short delay for emphasis
      setTimeout(() => {
        showMessage(`Open positions: ${currentOpenPositions}/${this.settings.maxTrades} limit`, 'warning');
      }, 3500);
    }
    
    // Also log to console for debugging
    console.warn('Open position limit exceeded:', {
      currentOpenPositions: currentOpenPositions,
      threshold: this.settings.maxTrades,
      message: `${currentOpenPositions} open positions exceed limit of ${this.settings.maxTrades}`
    });
  }



  hideWarningModal() {
    document.getElementById('overtradeWarningModal').classList.remove('show');
  }

  proceedWithTrade() {
    this.lastWarningTime = Date.now();
    this.warningCount++;
    
    // Record the trade
    if (this.pendingTradeData) {
      this.recordTrade(this.pendingTradeData.type, this.pendingTradeData.data);
    }
    
    // Save warning data immediately
    this.saveSettings();
    
    this.hideWarningModal();
    
    if (this.pendingTradeResolve) {
      this.pendingTradeResolve(true);
      this.pendingTradeResolve = null;
      this.pendingTradeData = null;
    }
  }

  cancelTradeFromWarning() {
    this.hideWarningModal();
    
    if (this.pendingTradeResolve) {
      this.pendingTradeResolve(false);
      this.pendingTradeResolve = null;
      this.pendingTradeData = null;
    }
  }

  disableReminders() {
    this.settings.enabled = false;
    this.saveSettings();
    this.proceedWithTrade();
    showMessage('Overtrade reminders disabled', 'info');
  }

  saveConfig() {
    // This method is now handled by the settings modal
    console.log('saveConfig called - now handled by settings modal');
  }

  async resetTradeCount() {
    this.tradeHistory = [];
    this.lastWarningTime = null;
    this.warningCount = 0;
    this.cachedOpenPositionsCount = 0;
    this.saveSettings();
    await this.updateStatusDisplay();
    showMessage('Trade count reset', 'info');
  }

  async updateStatusDisplay() {
    const currentOpenPositions = await this.getCurrentOpenPositions();
    const remaining = Math.max(0, this.settings.maxTrades - currentOpenPositions);
    const lastWarning = this.lastWarningTime ? new Date(this.lastWarningTime).toLocaleString() : 'Never';
    
    // Update settings modal display if elements exist
    const settingsCurrentTradeCountEl = document.getElementById('settingsCurrentTradeCount');
    const settingsRemainingTradesEl = document.getElementById('settingsRemainingTrades');
    const settingsNextResetEl = document.getElementById('settingsNextReset');
    const settingsLastWarningEl = document.getElementById('settingsLastWarning');
    
    if (settingsCurrentTradeCountEl) settingsCurrentTradeCountEl.textContent = currentOpenPositions;
    if (settingsRemainingTradesEl) settingsRemainingTradesEl.textContent = remaining;
    if (settingsNextResetEl) settingsNextResetEl.textContent = 'When positions close';
    if (settingsLastWarningEl) settingsLastWarningEl.textContent = lastWarning;
    
    // Update persistent panel
    this.updatePersistentPanel(currentOpenPositions);
    
    // Update toolbar status
    this.updateToolbarStatus(currentOpenPositions);
  }

  updatePersistentPanel(currentOpenPositions) {
    if (!this.settings.enabled) {
      // Hide the panel if overtrade control is disabled
      const panel = document.getElementById('overtradeReminderPanel');
      if (panel) panel.style.display = 'none';
      return;
    }

    const panel = document.getElementById('overtradeReminderPanel');
    const indicator = document.getElementById('overtradeIndicator');
    const icon = document.getElementById('indicatorIcon');
    const text = document.getElementById('indicatorText');
    const countEl = document.getElementById('currentTradeCount');
    const limitEl = document.getElementById('tradeLimit');
    const periodEl = document.getElementById('timePeriodDisplay');
    const resetEl = document.getElementById('nextResetTime');
    const messageEl = document.getElementById('overtradeMessage');

    if (!panel) return;

    // Show the panel
    panel.style.display = 'block';

    // Update basic info
    if (countEl) countEl.textContent = currentOpenPositions;
    if (limitEl) limitEl.textContent = this.settings.maxTrades;
    if (periodEl) periodEl.textContent = 'open positions';
    if (resetEl) {
      resetEl.textContent = 'When positions close';
    }

    // Determine status level
    const isOverLimit = currentOpenPositions >= this.settings.maxTrades;
    const isNearLimit = currentOpenPositions >= this.settings.maxTrades * 0.8;

    // Reset all classes
    panel.classList.remove('warning', 'danger');
    indicator.classList.remove('warning', 'danger');
    icon.classList.remove('warning', 'danger');
    text.classList.remove('warning', 'danger');
    if (countEl) countEl.classList.remove('warning', 'danger');

    if (isOverLimit) {
      // Danger state - over limit
      panel.classList.add('danger');
      indicator.classList.add('danger');
      icon.classList.add('danger');
      text.classList.add('danger');
      if (countEl) countEl.classList.add('danger');
      
      if (icon) icon.textContent = '🚨';
      if (text) text.textContent = 'OPEN POSITION LIMIT EXCEEDED!';
      if (messageEl) messageEl.style.display = 'flex';
    } else if (isNearLimit) {
      // Warning state - near limit
      panel.classList.add('warning');
      indicator.classList.add('warning');
      icon.classList.add('warning');
      text.classList.add('warning');
      if (countEl) countEl.classList.add('warning');
      
      if (icon) icon.textContent = '⚠️';
      if (text) text.textContent = 'Approaching Open Position Limit';
      if (messageEl) messageEl.style.display = 'none';
    } else {
      // Safe state
      if (icon) icon.textContent = '✅';
      if (text) text.textContent = 'Safe - Open Positions';
      if (messageEl) messageEl.style.display = 'none';
    }
  }

  updateToolbarStatus(currentOpenPositions) {
    const statusEl = document.getElementById('overtradeStatus');
    const displayEl = document.getElementById('tradeCountDisplay');
    
    if (!statusEl || !displayEl) return;
    
    if (!this.settings.enabled) {
      statusEl.style.display = 'none';
      return;
    }
    
    statusEl.style.display = 'block';
    displayEl.textContent = `${currentOpenPositions}/${this.settings.maxTrades} open`;
    
    // Update status color based on open position count
    statusEl.classList.remove('warning', 'danger');
    
    if (currentOpenPositions >= this.settings.maxTrades) {
      statusEl.classList.add('danger');
    } else if (currentOpenPositions >= this.settings.maxTrades * 0.8) {
      statusEl.classList.add('warning');
    }
  }

  startPeriodicCleanup() {
    // Update open positions count every 30 seconds
    setInterval(async () => {
      await this.getCurrentOpenPositions();
      await this.updateStatusDisplay();
    }, 30000);
    
    // Clean up old trades every minute (still needed for historical data)
    setInterval(() => {
      const beforeCount = this.tradeHistory.length;
      this.cleanupOldTrades();
      const afterCount = this.tradeHistory.length;
      
      if (beforeCount !== afterCount) {
        console.log(`Cleaned up ${beforeCount - afterCount} old trades`);
        this.saveSettings();
      }
    }, 60000);
    
    // Save data every 5 minutes as backup
    setInterval(() => {
      this.saveSettings();
      console.log('Backup save completed');
    }, 300000);
    
    // Save before window closes
    window.addEventListener('beforeunload', () => {
      this.saveSettings();
      console.log('Saving overtrade data before close');
    });
    
    // Initial status update
    setTimeout(async () => {
      await this.updateStatusDisplay();
    }, 100);
  }

  // Public method to check before executing trades
  async checkBeforeTrade(tradeType, tradeData = {}) {
    return await this.checkAndShowReminder(tradeType, tradeData);
  }

  // Method to record position management actions (doesn't count towards overtrade)
  recordPositionManagement(action, tradeData = {}) {
    console.log('Position management action recorded (not counted for overtrade):', {
      action,
      data: tradeData,
      timestamp: new Date().toLocaleString()
    });
    
    // Could store these separately if needed for analytics
    // For now, just log them
  }

  // Get current status for display
  async getStatus() {
    const currentOpenPositions = await this.getCurrentOpenPositions();
    return {
      enabled: this.settings.enabled,
      currentOpenPositions,
      threshold: this.settings.maxTrades,
      mode: 'open_positions',
      isOverThreshold: currentOpenPositions >= this.settings.maxTrades
    };
  }

  // Test method to simulate open positions for testing
  async simulateOpenPositionsForTesting(count = 5) {
    // Simulate open positions by setting the cached count
    this.cachedOpenPositionsCount = count;
    
    // Update the persistent panel
    await this.updateStatusDisplay();
    
    showMessage(`Simulated ${count} open positions for testing`, 'info');
    console.log(`Simulated ${count} open positions. Use resetTradeCount() to clear.`);
  }

  // Export data for backup
  exportData() {
    const data = {
      settings: this.settings,
      tradeHistory: this.tradeHistory,
      lastWarningTime: this.lastWarningTime,
      warningCount: this.warningCount,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overtrade-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage('Overtrade data exported', 'success');
  }

  // Import data from backup
  importData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (data.settings) this.settings = data.settings;
      if (data.tradeHistory) this.tradeHistory = data.tradeHistory;
      if (data.lastWarningTime) this.lastWarningTime = data.lastWarningTime;
      if (data.warningCount) this.warningCount = data.warningCount;
      
      this.saveSettings();
      this.updateStatusDisplay();
      
      showMessage('Overtrade data imported successfully', 'success');
      console.log('Imported data from:', data.exportDate);
    } catch (error) {
      console.error('Error importing data:', error);
      showMessage('Failed to import data', 'error');
    }
  }

  // Clear all data (for testing or reset)
  clearAllData() {
    // Use global confirmation function if available, otherwise fallback to confirm
    if (typeof showConfirmation === 'function') {
      showConfirmation(
        'Clear Overtrade Data',
        'Are you sure you want to clear all overtrade data? This cannot be undone.',
        () => {
          this.executeClearAllData();
        }
      );
    } else {
      if (confirm('Are you sure you want to clear all overtrade data? This cannot be undone.')) {
        this.executeClearAllData();
      }
    }
  }
  
  executeClearAllData() {
    localStorage.removeItem('overtradeSettings');
    localStorage.removeItem('overtradeHistory');
    localStorage.removeItem('overtradeLastWarning');
    localStorage.removeItem('overtradeWarningCount');
    
    this.tradeHistory = [];
    this.lastWarningTime = null;
    this.warningCount = 0;
    
    this.updateStatusDisplay();
    showMessage('All overtrade data cleared', 'info');
  }

  // Get detailed status for debugging
  async getDetailedStatus() {
    const currentOpenPositions = await this.getCurrentOpenPositions();
    return {
      enabled: this.settings.enabled,
      settings: this.settings,
      mode: 'open_positions_only',
      currentOpenPositions: currentOpenPositions,
      threshold: this.settings.maxTrades,
      totalNewPositionsRecorded: this.tradeHistory.length,
      oldestNewPosition: this.tradeHistory.length > 0 ? new Date(this.tradeHistory[0].timestamp).toLocaleString() : 'None',
      newestNewPosition: this.tradeHistory.length > 0 ? new Date(this.tradeHistory[this.tradeHistory.length - 1].timestamp).toLocaleString() : 'None',
      lastWarning: this.lastWarningTime ? new Date(this.lastWarningTime).toLocaleString() : 'Never',
      warningCount: this.warningCount,
      mt5Connected: window.mt5Bridge ? window.mt5Bridge.isConnected() : false,
      note: 'Now counting only currently open positions from MT5, not historical trades.'
    };
  }
}

// Initialize overtrade control
window.overtradeControl = new OvertradeControl();

// Add console helper for debugging
console.log('Overtrade Control initialized. Now counting only currently open positions from MT5. Use window.overtradeControl.getDetailedStatus() to check status.');