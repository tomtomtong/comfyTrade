// Alpha Vantage Data Node - Fetch market data from Alpha Vantage API

module.exports = {
  id: 'alphavantage-data',
  title: 'Alpha Vantage Data',
  category: 'ai',
  icon: '📊',
  description: 'Fetch market data from Alpha Vantage API (daily, intraday, crypto)',

  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],

  params: {
    function: 'TIME_SERIES_DAILY',
    symbol: 'AAPL',
    interval: '60min',
    outputsize: 'compact',
    market: 'USD',
    entitlement: 'delayed',
    extended_hours: 'false'
  },

  paramConfig: {
    function: {
      type: 'select',
      label: 'Function',
      options: [
        { value: 'TIME_SERIES_DAILY', label: 'Daily Prices' },
        { value: 'TIME_SERIES_INTRADAY', label: 'Intraday Prices' },
        { value: 'DIGITAL_CURRENCY_DAILY', label: 'Cryptocurrency Daily' },
        { value: 'DIGITAL_CURRENCY_INTRADAY', label: 'Cryptocurrency Intraday' }
      ]
    },
    symbol: {
      type: 'text',
      label: 'Symbol',
      placeholder: 'AAPL, BTC, ETH, etc.'
    },
    interval: {
      type: 'select',
      label: 'Interval (Intraday only)',
      options: [
        { value: '1min', label: '1 minute' },
        { value: '5min', label: '5 minutes' },
        { value: '15min', label: '15 minutes' },
        { value: '30min', label: '30 minutes' },
        { value: '60min', label: '60 minutes' }
      ]
    },
    outputsize: {
      type: 'select',
      label: 'Output Size',
      options: [
        { value: 'compact', label: 'Compact (last 100 data points)' },
        { value: 'full', label: 'Full (all available data)' }
      ]
    },
    market: {
      type: 'text',
      label: 'Market (Crypto only)',
      placeholder: 'USD'
    },
    entitlement: {
      type: 'select',
      label: 'Entitlement',
      options: [
        { value: 'delayed', label: 'Delayed' },
        { value: 'realtime', label: 'Real-time (premium)' }
      ]
    },
    extended_hours: {
      type: 'select',
      label: 'Extended Hours',
      options: [
        { value: 'false', label: 'False' },
        { value: 'true', label: 'True' }
      ]
    }
  },

  validate(node) {
    if (!node.params.symbol || node.params.symbol.trim() === '') {
      return 'Symbol is required';
    }

    const func = node.params.function || 'TIME_SERIES_DAILY';
    
    // Validate interval for intraday functions
    if (func === 'TIME_SERIES_INTRADAY' || func === 'DIGITAL_CURRENCY_INTRADAY') {
      const validIntervals = ['1min', '5min', '15min', '30min', '60min'];
      if (!validIntervals.includes(node.params.interval)) {
        return 'Valid interval is required for intraday functions';
      }
    }

    // Validate market for crypto functions
    if (func === 'DIGITAL_CURRENCY_DAILY' || func === 'DIGITAL_CURRENCY_INTRADAY') {
      if (!node.params.market || node.params.market.trim() === '') {
        return 'Market is required for cryptocurrency functions';
      }
    }

    return null;
  },

  async execute(node, inputData, context) {
    try {
      // Get API key from settings
      const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
      const apiKey = settings.ai?.alphavantage?.apiKey;
      const baseUrl = settings.ai?.alphavantage?.baseUrl || 'https://www.alphavantage.co/query';

      if (!apiKey) {
        node.outputData = JSON.stringify({
          error: 'Alpha Vantage API key not configured',
          message: 'Please configure your API key in Settings > AI > Alpha Vantage'
        }, null, 2);
        if (context && context.showMessage) {
          context.showMessage('Alpha Vantage API key not configured', 'error');
        }
        return false;
      }

      // Get symbol from input or params
      let symbol = node.params.symbol || 'AAPL';
      if (typeof inputData === 'string' && inputData.trim() !== '') {
        symbol = inputData.trim();
      }

      // Build API parameters
      const func = node.params.function || 'TIME_SERIES_DAILY';
      const params = new URLSearchParams({
        function: func,
        symbol: symbol,
        apikey: apiKey
      });

      // Add function-specific parameters
      if (func === 'TIME_SERIES_INTRADAY') {
        params.append('interval', node.params.interval || '60min');
        params.append('outputsize', node.params.outputsize || 'compact');
        params.append('entitlement', node.params.entitlement || 'delayed');
        params.append('extended_hours', node.params.extended_hours || 'false');
      } else if (func === 'TIME_SERIES_DAILY') {
        params.append('outputsize', node.params.outputsize || 'compact');
        if (node.params.entitlement) {
          params.append('entitlement', node.params.entitlement);
        }
      } else if (func === 'DIGITAL_CURRENCY_DAILY') {
        params.append('market', node.params.market || 'USD');
      } else if (func === 'DIGITAL_CURRENCY_INTRADAY') {
        params.append('market', node.params.market || 'USD');
        params.append('interval', node.params.interval || '60min');
      }

      const url = `${baseUrl}?${params.toString()}`;
      
      if (context && context.showMessage) {
        context.showMessage(`Fetching ${func} data for ${symbol}...`, 'info');
      }

      // Make API request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (data['Note']) {
        throw new Error(`API rate limit: ${data['Note']}`);
      }

      if (data['Information']) {
        throw new Error(`API information: ${data['Information']}`);
      }

      // Convert crypto format to standard format if needed
      let processedData = data;
      if (func === 'DIGITAL_CURRENCY_DAILY' && data['Time Series (Digital Currency Daily)']) {
        // Convert to standard format
        processedData = {
          ...data,
          'Time Series (Daily)': data['Time Series (Digital Currency Daily)']
        };
        delete processedData['Time Series (Digital Currency Daily)'];
      } else if (func === 'DIGITAL_CURRENCY_INTRADAY' && data['Time Series (Digital Currency Intraday)']) {
        // Convert to standard format
        const interval = node.params.interval || '60min';
        processedData = {
          ...data,
          [`Time Series (${interval})`]: data['Time Series (Digital Currency Intraday)']
        };
        delete processedData['Time Series (Digital Currency Intraday)'];
      }

      // Store the data
      node.fetchedData = JSON.stringify(processedData, null, 2);
      node.outputData = node.fetchedData;

      if (context && context.showMessage) {
        const metaData = processedData['Meta Data'] || {};
        const symbolName = metaData['2. Symbol'] || symbol;
        context.showMessage(`✓ Fetched data for ${symbolName}`, 'success');
      }

      return true;

    } catch (error) {
      console.error('Alpha Vantage Data error:', error);
      node.outputData = JSON.stringify({
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2);
      
      if (context && context.showMessage) {
        context.showMessage(`Alpha Vantage Data error: ${error.message}`, 'error');
      }
      return false;
    }
  }
};

