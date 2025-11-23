// Alpha Vantage Sentiment Analysis Node - Analyze market sentiment using Alpha Vantage News & Sentiment API
// Based on market_news_sentiment_analyzer.py

module.exports = {
  id: 'alphavantage-sentiment',
  title: 'Alpha Vantage Sentiment',
  category: 'ai',
  icon: '📰',
  description: 'Analyze market sentiment using Alpha Vantage News & Sentiment API',

  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],

  params: {
    tickers: '',
    topics: '',
    sort: 'LATEST',
    limit: '20',
    days_back: '7',
    time_from: '',
    time_to: ''
  },

  paramConfig: {
    tickers: {
      type: 'textarea',
      label: 'Tickers',
      placeholder: 'AAPL, MSFT or COIN,CRYPTO:BTC,FOREX:USD',
      description: 'Stock symbols, crypto (CRYPTO:BTC), or forex (FOREX:USD). Comma-separated.'
    },
    topics: {
      type: 'textarea',
      label: 'Topics',
      placeholder: 'technology, earnings, blockchain',
      description: 'Comma-separated topics: blockchain, earnings, ipo, mergers_and_acquisitions, financial_markets, economy_fiscal, economy_monetary, economy_macro, energy_transportation, finance, life_sciences, manufacturing, real_estate, retail_wholesale, technology'
    },
    sort: {
      type: 'select',
      label: 'Sort Order',
      options: [
        { value: 'LATEST', label: 'Latest' },
        { value: 'EARLIEST', label: 'Earliest' },
        { value: 'RELEVANCE', label: 'Relevance' }
      ]
    },
    limit: {
      type: 'number',
      label: 'Limit',
      min: 1,
      max: 1000,
      step: 1,
      description: 'Maximum number of articles to return (1-1000)'
    },
    days_back: {
      type: 'number',
      label: 'Days Back',
      min: 1,
      max: 365,
      step: 1,
      description: 'Number of days to look back (used when time_from/time_to not specified)'
    },
    time_from: {
      type: 'text',
      label: 'Time From',
      placeholder: '2025-01-01 or 20220410T0130',
      description: 'Start time in YYYY-MM-DD or YYYYMMDDTHHMM format (optional)'
    },
    time_to: {
      type: 'text',
      label: 'Time To',
      placeholder: '2025-01-15 or 20220420T0130',
      description: 'End time in YYYY-MM-DD or YYYYMMDDTHHMM format (optional)'
    }
  },

  // Supported topics from Python analyzer
  SUPPORTED_TOPICS: [
    'blockchain',
    'earnings',
    'ipo',
    'mergers_and_acquisitions',
    'financial_markets',
    'economy_fiscal',
    'economy_monetary',
    'economy_macro',
    'energy_transportation',
    'finance',
    'life_sciences',
    'manufacturing',
    'real_estate',
    'retail_wholesale',
    'technology'
  ],

  /**
   * Convert date string to Alpha Vantage format (YYYYMMDDTHHMM)
   * Supports YYYY-MM-DD and YYYY-MM-DD HH:MM:SS formats
   */
  convertToAlphaVantageDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') {
      return null;
    }

    try {
      let dt;
      
      // Handle YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        dt = new Date(dateStr + 'T00:00:00');
      }
      // Handle YYYY-MM-DD HH:MM:SS format
      else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        dt = new Date(dateStr.replace(' ', 'T'));
      }
      // Already in Alpha Vantage format
      else if (/^\d{8}T\d{4}$/.test(dateStr)) {
        return dateStr;
      }
      else {
        throw new Error(`Invalid date format: ${dateStr}`);
      }

      if (isNaN(dt.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
      }

      // Format as YYYYMMDDTHHMM
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');

      return `${year}${month}${day}T${hours}${minutes}`;
    } catch (error) {
      console.error(`Failed to convert date: ${error.message}`);
      return null;
    }
  },

  /**
   * Parse date from various formats to standard format (YYYY-MM-DD HH:MM:SS)
   */
  parseDateToStandard(dateStr) {
    if (!dateStr || dateStr === 'unknown') {
      return 'unknown';
    }

    try {
      // Handle Alpha Vantage format: "20250410T0130" or "20251105T121200"
      if (/^\d{8}T\d{4,6}$/.test(dateStr)) {
        const datePart = dateStr.split('T')[0];
        const timePart = dateStr.split('T')[1];
        
        if (datePart.length === 8) {
          const year = datePart.substring(0, 4);
          const month = datePart.substring(4, 6);
          const day = datePart.substring(6, 8);
          
          let hours = '00';
          let minutes = '00';
          let seconds = '00';
          
          if (timePart.length >= 4) {
            hours = timePart.substring(0, 2);
            minutes = timePart.substring(2, 4);
          }
          if (timePart.length >= 6) {
            seconds = timePart.substring(4, 6);
          }
          
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
      }

      // Handle ISO 8601 format
      if (dateStr.includes('T')) {
        let datePart = dateStr;
        if (dateStr.includes('+')) {
          datePart = dateStr.split('+')[0];
        } else if (dateStr.endsWith('Z')) {
          datePart = dateStr.replace('Z', '');
        }
        
        if (datePart.includes('.')) {
          datePart = datePart.split('.')[0];
        }
        
        const dt = new Date(datePart);
        if (!isNaN(dt.getTime())) {
          return dt.toISOString().replace('T', ' ').substring(0, 19);
        }
      }

      // Handle standard format "YYYY-MM-DD HH:MM:SS"
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Handle date-only format "YYYY-MM-DD"
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return `${dateStr} 00:00:00`;
      }
    } catch (error) {
      console.error(`Failed to parse date: ${error.message}`);
    }

    return dateStr;
  },

  /**
   * Analyze sentiment from articles (matching Python analyzer.analyze_sentiment)
   */
  analyzeSentiment(articles) {
    if (!articles || articles.length === 0) {
      return {
        total_articles: 0,
        average_sentiment: 0,
        sentiment_distribution: {},
        ticker_sentiment: {}
      };
    }

    const sentimentScores = [];
    const sentimentLabels = {};
    const tickerSentiments = {};

    for (const article of articles) {
      // Overall sentiment
      const score = parseFloat(article.overall_sentiment_score || 0);
      const label = article.overall_sentiment_label || 'Unknown';

      if (score !== 0 || article.overall_sentiment_score) {
        sentimentScores.push(score);
        sentimentLabels[label] = (sentimentLabels[label] || 0) + 1;
      }

      // Ticker sentiment
      const tickerSentiment = article.ticker_sentiment || [];
      for (const tickerInfo of tickerSentiment) {
        const ticker = tickerInfo.ticker || 'Unknown';
        const tickerScore = parseFloat(tickerInfo.ticker_sentiment_score || 0);
        const tickerLabel = tickerInfo.ticker_sentiment_label || 'Unknown';

        if (!tickerSentiments[ticker]) {
          tickerSentiments[ticker] = {
            scores: [],
            labels: {}
          };
        }

        if (tickerScore !== 0 || tickerInfo.ticker_sentiment_score) {
          tickerSentiments[ticker].scores.push(tickerScore);
        }
        tickerSentiments[ticker].labels[tickerLabel] = 
          (tickerSentiments[ticker].labels[tickerLabel] || 0) + 1;
      }
    }

    // Calculate averages
    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;

    // Calculate ticker averages
    const tickerAverages = {};
    for (const [ticker, data] of Object.entries(tickerSentiments)) {
      const avg = data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0;
      tickerAverages[ticker] = {
        average_sentiment: Math.round(avg * 1000) / 1000,
        label_distribution: data.labels
      };
    }

    return {
      total_articles: articles.length,
      average_sentiment: Math.round(avgSentiment * 1000) / 1000,
      sentiment_distribution: sentimentLabels,
      ticker_sentiment: tickerAverages
    };
  },

  validate(node) {
    // At least one of tickers or topics should be provided
    const tickers = (node.params.tickers || '').trim();
    const topics = (node.params.topics || '').trim();

    if (!tickers && !topics) {
      return 'Either tickers or topics must be provided';
    }

    // Validate limit
    const limit = parseInt(node.params.limit || '20');
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return 'Limit must be between 1 and 1000';
    }

    // Validate days_back
    const daysBack = parseInt(node.params.days_back || '7');
    if (isNaN(daysBack) || daysBack < 1 || daysBack > 365) {
      return 'Days back must be between 1 and 365';
    }

    // Validate time format if provided (accept both formats)
    const timeFrom = (node.params.time_from || '').trim();
    const timeTo = (node.params.time_to || '').trim();

    if (timeFrom) {
      const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(timeFrom) || 
                           /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timeFrom) ||
                           /^\d{8}T\d{4}$/.test(timeFrom);
      if (!isValidFormat) {
        return 'Time From must be in YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, or YYYYMMDDTHHMM format';
      }
    }

    if (timeTo) {
      const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(timeTo) || 
                           /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timeTo) ||
                           /^\d{8}T\d{4}$/.test(timeTo);
      if (!isValidFormat) {
        return 'Time To must be in YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, or YYYYMMDDTHHMM format';
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
        const errorResult = {
          success: false,
          error: 'Alpha Vantage API key not configured',
          message: 'Please configure your API key in Settings > AI > Alpha Vantage',
          timestamp: new Date().toISOString(),
          node_type: 'alphavantage-sentiment'
        };
        node.outputData = JSON.stringify(errorResult, null, 2);
        node.sentimentData = node.outputData;
        if (context && context.showMessage) {
          context.showMessage('Alpha Vantage API key not configured', 'error');
        }
        return false;
      }

      // Get tickers/topics from input or params
      let tickers = (node.params.tickers || '').trim();
      let topics = (node.params.topics || '').trim();

      // If string input is provided, use it as tickers
      if (typeof inputData === 'string' && inputData.trim() !== '') {
        tickers = inputData.trim();
      }

      // Determine time range
      let timeFrom = (node.params.time_from || '').trim();
      let timeTo = (node.params.time_to || '').trim();

      // If no explicit dates, use days_back
      if (!timeFrom && !timeTo) {
        const daysBack = parseInt(node.params.days_back || '7');
        const now = new Date();
        const fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - daysBack);
        
        timeTo = now.toISOString().split('T')[0]; // YYYY-MM-DD
        timeFrom = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD
      }

      // Convert date formats to Alpha Vantage format if needed
      if (timeFrom && timeFrom.includes('-')) {
        const converted = this.convertToAlphaVantageDate(timeFrom);
        if (converted) {
          timeFrom = converted;
        }
      }

      if (timeTo && timeTo.includes('-')) {
        const converted = this.convertToAlphaVantageDate(timeTo);
        if (converted) {
          timeTo = converted;
        }
      }

      // Build API parameters
      const params = new URLSearchParams({
        function: 'NEWS_SENTIMENT',
        apikey: apiKey,
        sort: node.params.sort || 'LATEST',
        limit: Math.min(parseInt(node.params.limit || '20'), 1000).toString() // API max is 1000
      });

      // Add optional parameters
      if (tickers) {
        params.append('tickers', tickers);
      }

      if (topics) {
        params.append('topics', topics);
      }

      if (timeFrom) {
        params.append('time_from', timeFrom);
      }

      if (timeTo) {
        params.append('time_to', timeTo);
      }

      const url = `${baseUrl}?${params.toString()}`;
      
      if (context && context.showMessage) {
        const searchTerms = tickers || topics || 'news';
        context.showMessage(`Fetching sentiment analysis for ${searchTerms}...`, 'info');
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
        const errorResult = {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: `Failed to fetch data from Alpha Vantage API. Status: ${response.status}`,
          timestamp: new Date().toISOString(),
          node_type: 'alphavantage-sentiment',
          http_status: response.status
        };
        node.outputData = JSON.stringify(errorResult, null, 2);
        node.sentimentData = node.outputData;
        if (context && context.showMessage) {
          context.showMessage(`HTTP Error ${response.status}: ${response.statusText}`, 'error');
        }
        return false;
      }

      const data = await response.json();

      // Check for API errors (matching Python analyzer error handling)
      if (data['Error Message']) {
        const errorResult = {
          success: false,
          error: data['Error Message'],
          message: 'Alpha Vantage API returned an error message',
          timestamp: new Date().toISOString(),
          node_type: 'alphavantage-sentiment',
          api_response: data
        };
        node.outputData = JSON.stringify(errorResult, null, 2);
        node.sentimentData = node.outputData;
        if (context && context.showMessage) {
          context.showMessage(`API Error: ${data['Error Message']}`, 'error');
        }
        return false;
      }

      if (data['Note']) {
        const errorResult = {
          success: false,
          error: 'API rate limit reached',
          message: data['Note'],
          timestamp: new Date().toISOString(),
          node_type: 'alphavantage-sentiment',
          api_response: data
        };
        node.outputData = JSON.stringify(errorResult, null, 2);
        node.sentimentData = node.outputData;
        if (context && context.showMessage) {
          context.showMessage(`API Rate Limit: ${data['Note']}`, 'error');
        }
        return false;
      }

      if (data['Information']) {
        const errorResult = {
          success: false,
          error: 'API information message',
          message: data['Information'],
          timestamp: new Date().toISOString(),
          node_type: 'alphavantage-sentiment',
          api_response: data
        };
        node.outputData = JSON.stringify(errorResult, null, 2);
        node.sentimentData = node.outputData;
        if (context && context.showMessage) {
          context.showMessage(`API Info: ${data['Information']}`, 'error');
        }
        return false;
      }

      // Process the response
      const feed = data.feed || [];
      
      if (feed.length === 0) {
        const warningResult = {
          success: true,
          warning: 'Alpha Vantage API returned empty feed',
          timestamp: new Date().toISOString(),
          search_params: {
            tickers: tickers || null,
            topics: topics || null,
            sort: node.params.sort || 'LATEST',
            limit: parseInt(node.params.limit || '20')
          },
          total_articles: 0,
          articles: []
        };
        node.outputData = JSON.stringify(warningResult, null, 2);
        node.sentimentData = node.outputData;
        if (context && context.showMessage) {
          context.showMessage('No articles found', 'warning');
        }
        return true;
      }

      // Process articles with standardized date format
      const articles = feed.map(article => {
        const sentimentScore = parseFloat(article.overall_sentiment_score || 0);
        const sentimentLabel = article.overall_sentiment_label || 'NEUTRAL';
        
        // Parse time_published to standard format
        const timePublished = this.parseDateToStandard(article.time_published || '');

        return {
          title: article.title || '',
          summary: article.summary || '',
          url: article.url || '',
          time_published: article.time_published || '',
          time_published_formatted: timePublished,
          source: article.source || '',
          overall_sentiment_score: sentimentScore,
          overall_sentiment_label: sentimentLabel,
          ticker_sentiment: article.ticker_sentiment || [],
          topics: article.topics || []
        };
      });

      // Perform comprehensive sentiment analysis (matching Python analyzer)
      const sentimentAnalysis = this.analyzeSentiment(articles);

      // Calculate overall sentiment label
      let overallSentimentLabel = 'NEUTRAL';
      const avgScore = sentimentAnalysis.average_sentiment;
      if (avgScore > 0.1) {
        overallSentimentLabel = 'BULLISH';
      } else if (avgScore < -0.1) {
        overallSentimentLabel = 'BEARISH';
      }

      // Create comprehensive result object (matching Python analyzer structure)
      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        search_params: {
          tickers: tickers || null,
          topics: topics || null,
          sort: node.params.sort || 'LATEST',
          limit: parseInt(node.params.limit || '20'),
          time_from: timeFrom || null,
          time_to: timeTo || null
        },
        total_articles: articles.length,
        overall_sentiment: overallSentimentLabel,
        average_sentiment_score: sentimentAnalysis.average_sentiment,
        sentiment_distribution: sentimentAnalysis.sentiment_distribution,
        ticker_sentiment: sentimentAnalysis.ticker_sentiment,
        articles: articles,
        raw_response: data // Include raw API response for debugging
      };

      // Store the result
      node.sentimentData = JSON.stringify(result, null, 2);
      node.outputData = node.sentimentData;

      if (context && context.showMessage) {
        const sentimentPercent = Math.round(avgScore * 100);
        context.showMessage(
          `✓ Analyzed ${articles.length} articles - ${overallSentimentLabel} (${sentimentPercent > 0 ? '+' : ''}${sentimentPercent}%)`,
          'success'
        );
      }

      return true;

    } catch (error) {
      console.error('Alpha Vantage Sentiment error:', error);
      const errorResult = {
        success: false,
        error: error.message || 'Unknown error',
        message: `An error occurred while fetching sentiment analysis: ${error.message}`,
        timestamp: new Date().toISOString(),
        node_type: 'alphavantage-sentiment',
        error_type: error.name || 'Error',
        stack: error.stack || undefined
      };
      node.outputData = JSON.stringify(errorResult, null, 2);
      node.sentimentData = node.outputData;
      
      if (context && context.showMessage) {
        context.showMessage(`Alpha Vantage Sentiment error: ${error.message}`, 'error');
      }
      return false;
    }
  }
};
