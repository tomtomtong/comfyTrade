/**
 * Twilio Alert Service for MT5 Trading Application
 * Sends SMS/WhatsApp notifications for take profit and other trading events
 */

const twilio = require('twilio');

class TwilioAlerts {
  constructor(accountSid = null, authToken = null, fromNumber = null) {
    /**
     * Initialize Twilio client
     * 
     * @param {string} accountSid - Twilio Account SID
     * @param {string} authToken - Twilio Auth Token
     * @param {string} fromNumber - Twilio phone number
     */
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
    
    if (!accountSid || !authToken || !fromNumber) {
      console.warn("Twilio credentials not fully configured. Alerts will be disabled.");
      this.client = null;
      this.enabled = false;
    } else {
      try {
        this.client = twilio(accountSid, authToken);
        this.enabled = true;
        console.log("Twilio client initialized successfully");
      } catch (error) {
        console.error(`Failed to initialize Twilio client: ${error}`);
        this.client = null;
        this.enabled = false;
      }
    }
  }
  
  isEnabled() {
    /**Check if Twilio alerts are enabled and configured*/
    return this.enabled && this.client !== null;
  }
  
  async sendSMS(toNumber, message) {
    /**
     * Send SMS notification
     * 
     * @param {string} toNumber - Recipient phone number (e.g., '+1234567890')
     * @param {string} message - Message content
     * @returns {Promise<Object>} Dict with success status and message details
     */
    if (!this.isEnabled()) {
      return { success: false, error: "Twilio not configured" };
    }
    
    try {
      const messageObj = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber
      });
      
      console.log(`SMS sent successfully to ${toNumber}, SID: ${messageObj.sid}`);
      return {
        success: true,
        sid: messageObj.sid,
        status: messageObj.status,
        message: "SMS sent successfully"
      };
      
    } catch (error) {
      console.error(`Failed to send SMS to ${toNumber}: ${error}`);
      return { success: false, error: error.message };
    }
  }
  
  async sendWhatsApp(toNumber, message) {
    /**
     * Send WhatsApp notification
     * 
     * @param {string} toNumber - Recipient WhatsApp number (e.g., 'whatsapp:+1234567890')
     * @param {string} message - Message content
     * @returns {Promise<Object>} Dict with success status and message details
     */
    if (!this.isEnabled()) {
      return { success: false, error: "Twilio not configured" };
    }
    
    // Ensure WhatsApp format
    if (!toNumber.startsWith('whatsapp:')) {
      toNumber = `whatsapp:${toNumber}`;
    }
    
    const fromWhatsApp = `whatsapp:${this.fromNumber}`;
    
    try {
      const messageObj = await this.client.messages.create({
        body: message,
        from: fromWhatsApp,
        to: toNumber
      });
      
      console.log(`WhatsApp sent successfully to ${toNumber}, SID: ${messageObj.sid}`);
      return {
        success: true,
        sid: messageObj.sid,
        status: messageObj.status,
        message: "WhatsApp sent successfully"
      };
      
    } catch (error) {
      console.error(`Failed to send WhatsApp to ${toNumber}: ${error}`);
      return { success: false, error: error.message };
    }
  }
  
  async sendTakeProfitAlert(positionData, toNumber, method = "sms") {
    /**
     * Send take profit alert notification
     * 
     * @param {Object} positionData - Dictionary containing position information
     * @param {string} toNumber - Recipient phone number
     * @param {string} method - 'sms' or 'whatsapp'
     * @returns {Promise<Object>} Dict with success status and message details
     */
    try {
      const symbol = positionData.symbol || 'Unknown';
      const ticket = positionData.ticket || 'Unknown';
      const profit = positionData.profit || 0;
      
      const message = `🎯 ${symbol} TP hit ${profit.toFixed(2)} #${ticket}`;
      
      if (method.toLowerCase() === "whatsapp") {
        return await this.sendWhatsApp(toNumber, message);
      } else {
        return await this.sendSMS(toNumber, message);
      }
      
    } catch (error) {
      console.error(`Failed to send take profit alert: ${error}`);
      return { success: false, error: error.message };
    }
  }
  
  async sendStopLossAlert(positionData, toNumber, method = "sms") {
    /**
     * Send stop loss alert notification
     * 
     * @param {Object} positionData - Dictionary containing position information
     * @param {string} toNumber - Recipient phone number
     * @param {string} method - 'sms' or 'whatsapp'
     * @returns {Promise<Object>} Dict with success status and message details
     */
    try {
      const symbol = positionData.symbol || 'Unknown';
      const ticket = positionData.ticket || 'Unknown';
      const profit = positionData.profit || 0;
      
      const message = `🛑 ${symbol} SL hit ${profit.toFixed(2)} #${ticket}`;
      
      if (method.toLowerCase() === "whatsapp") {
        return await this.sendWhatsApp(toNumber, message);
      } else {
        return await this.sendSMS(toNumber, message);
      }
      
    } catch (error) {
      console.error(`Failed to send stop loss alert: ${error}`);
      return { success: false, error: error.message };
    }
  }
  
  async sendPositionOpenedAlert(positionData, toNumber, method = "sms") {
    /**
     * Send position opened alert notification
     * 
     * @param {Object} positionData - Dictionary containing position information
     * @param {string} toNumber - Recipient phone number
     * @param {string} method - 'sms' or 'whatsapp'
     * @returns {Promise<Object>} Dict with success status and message details
     */
    try {
      const symbol = positionData.symbol || 'Unknown';
      const ticket = positionData.ticket || 'Unknown';
      const volume = positionData.volume || 0;
      const orderType = positionData.type || 'Unknown';
      
      const message = `📈 ${symbol} ${orderType} ${volume} opened #${ticket}`;
      
      if (method.toLowerCase() === "whatsapp") {
        return await this.sendWhatsApp(toNumber, message);
      } else {
        return await this.sendSMS(toNumber, message);
      }
      
    } catch (error) {
      console.error(`Failed to send position opened alert: ${error}`);
      return { success: false, error: error.message };
    }
  }
  
  async sendCustomAlert(message, toNumber, method = "sms") {
    /**
     * Send custom alert message
     * 
     * @param {string} message - Custom message content
     * @param {string} toNumber - Recipient phone number
     * @param {string} method - 'sms' or 'whatsapp'
     * @returns {Promise<Object>} Dict with success status and message details
     */
    if (method.toLowerCase() === "whatsapp") {
      return await this.sendWhatsApp(toNumber, message);
    } else {
      return await this.sendSMS(toNumber, message);
    }
  }
}

module.exports = TwilioAlerts;