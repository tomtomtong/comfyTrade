// Application Configuration
const AppConfig = {

  // Twilio configuration
  twilioSettings: {
    enabled: false,
    accountSid: '',
    authToken: '',
    fromNumber: '',
    recipientNumber: '',
    method: 'sms',
    alerts: {
      take_profit: true,
      stop_loss: true,
      position_opened: false,
      position_closed: false
    }
  },
  

  
  // Get Twilio settings
  getTwilioSettings() {
    return { ...this.twilioSettings };
  },
  
  // Update Twilio settings
  updateTwilioSettings(settings) {
    this.twilioSettings = {
      ...this.twilioSettings,
      ...settings
    };
    this.saveToLocalStorage();
  },
  
  // Save configuration to localStorage
  saveToLocalStorage() {
    localStorage.setItem('appConfig', JSON.stringify({
      twilioSettings: this.twilioSettings
    }));
  },
  
  // Load configuration from localStorage
  loadFromLocalStorage() {
    const saved = localStorage.getItem('appConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.twilioSettings && typeof config.twilioSettings === 'object') {
          this.twilioSettings = {
            ...this.twilioSettings,
            ...config.twilioSettings
          };
        }
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }
};

// Load config on startup
AppConfig.loadFromLocalStorage();
