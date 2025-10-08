// Application Configuration
const AppConfig = {
  // Quick symbol buttons configuration
  quickSymbols: [
    'EURUSD',
    'GBPUSD',
    'USDJPY',
    'AUDUSD',
    'USDCAD'
  ],
  
  // Add more symbols here as needed
  // Example: 'EURJPY', 'EURGBP', 'NZDUSD', 'XAUUSD', etc.
  
  // Get quick symbols array
  getQuickSymbols() {
    return this.quickSymbols;
  },
  
  // Add a new quick symbol
  addQuickSymbol(symbol) {
    if (!this.quickSymbols.includes(symbol)) {
      this.quickSymbols.push(symbol);
      this.saveToLocalStorage();
    }
  },
  
  // Remove a quick symbol
  removeQuickSymbol(symbol) {
    const index = this.quickSymbols.indexOf(symbol);
    if (index > -1) {
      this.quickSymbols.splice(index, 1);
      this.saveToLocalStorage();
    }
  },
  
  // Save configuration to localStorage
  saveToLocalStorage() {
    localStorage.setItem('appConfig', JSON.stringify({
      quickSymbols: this.quickSymbols
    }));
  },
  
  // Load configuration from localStorage
  loadFromLocalStorage() {
    const saved = localStorage.getItem('appConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.quickSymbols && Array.isArray(config.quickSymbols)) {
          this.quickSymbols = config.quickSymbols;
        }
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }
};

// Load config on startup
AppConfig.loadFromLocalStorage();
