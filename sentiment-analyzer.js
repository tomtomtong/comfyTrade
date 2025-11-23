/**
 * Sentiment Analysis Module
 * Fetches news from Alpha Vantage News & Sentiment API for any keywords
 */

class SentimentAnalyzer {
  constructor(apiKey = null, baseUrl = 'https://www.alphavantage.co/query') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Simple sentiment analysis using keyword matching and basic scoring
   */
  analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
      return { label: 'neutral', score: 0, method: 'keyword' };
    }

    const lowerText = text.toLowerCase();
    
    // Positive keywords
    const positiveKeywords = [
      'bullish', 'surge', 'rally', 'gain', 'rise', 'up', 'growth', 'profit',
      'success', 'breakthrough', 'adoption', 'institutional', 'approval',
      'positive', 'optimistic', 'strong', 'momentum', 'record', 'high',
      'soar', 'jump', 'climb', 'advance', 'boost', 'increase', 'upgrade'
    ];
    
    // Negative keywords
    const negativeKeywords = [
      'bearish', 'crash', 'drop', 'fall', 'decline', 'loss', 'down', 'plunge',
      'failure', 'reject', 'ban', 'regulation', 'risk', 'concern', 'worry',
      'negative', 'pessimistic', 'weak', 'volatility', 'uncertainty', 'fear',
      'sink', 'tumble', 'slump', 'decrease', 'downgrade', 'warning', 'alert'
    ];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) positiveCount += matches.length;
    });
    
    negativeKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) negativeCount += matches.length;
    });
    
    // Calculate score (-1 to 1)
    const total = positiveCount + negativeCount;
    let score = 0;
    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
    }
    
    // Classify sentiment
    let label = 'neutral';
    if (score > 0.1) {
      label = 'positive';
    } else if (score < -0.1) {
      label = 'negative';
    }
    
    return {
      label,
      score: Math.max(-1, Math.min(1, score)),
      positiveCount,
      negativeCount,
      method: 'keyword'
    };
  }

  /**
   * Fetch news from Alpha Vantage News & Sentiment API
   * Returns both processed articles and raw API response
   */
  async fetchAlphaVantageNews(keywords, limit = 50) {
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not provided');
      return { articles: [], rawResponse: null };
    }

    try {
      // Validate keywords
      if (!keywords || (typeof keywords === 'string' && keywords.trim() === '') || 
          (Array.isArray(keywords) && keywords.length === 0)) {
        console.warn('No keywords provided for sentiment analysis');
        return { articles: [], rawResponse: null };
      }

      const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
      
      // Alpha Vantage NEWS_SENTIMENT accepts either 'tickers' or 'topics'
      // Determine if keywords are stock tickers or topics
      // Valid topics: blockchain, earnings, ipo, mergers_and_acquisitions, financial_markets, 
      // economy_fiscal, economy_monetary, economy_macro, energy_transportation, finance, 
      // life_sciences, manufacturing, real_estate, retail_wholesale, technology
      const validTopics = [
        'blockchain', 'earnings', 'ipo', 'mergers_and_acquisitions', 'financial_markets',
        'economy_fiscal', 'economy_monetary', 'economy_macro', 'energy_transportation',
        'finance', 'life_sciences', 'manufacturing', 'real_estate', 'retail_wholesale', 'technology'
      ];
      
      // Separate tickers and topics
      const tickers = [];
      const topics = [];
      
      // Common cryptocurrency base symbols
      const cryptoBaseSymbols = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'SUI', 'LINK', 'AVAX', 'LTC', 'DOT', 'BNB', 'DOGE', 'MATIC', 'ATOM', 'ALGO'];
      // Common fiat currencies for crypto pairs
      const fiatCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'NZD'];
      
      // Helper function to detect and format crypto symbols
      const formatTicker = (symbol) => {
        const upperSymbol = symbol.toUpperCase().trim();
        
        // Check if it's a crypto pair format (e.g., BTCUSD, ETHUSD)
        for (const crypto of cryptoBaseSymbols) {
          for (const fiat of fiatCurrencies) {
            if (upperSymbol === `${crypto}${fiat}` || upperSymbol === `${crypto}-${fiat}` || upperSymbol === `${crypto}_${fiat}`) {
              return `CRYPTO:${crypto}`;
            }
          }
        }
        
        // Check if it's just a crypto base symbol (e.g., BTC, ETH)
        if (cryptoBaseSymbols.includes(upperSymbol)) {
          return `CRYPTO:${upperSymbol}`;
        }
        
        // Check if it's a forex pair (e.g., EURUSD, GBPUSD)
        if (upperSymbol.length === 6 && fiatCurrencies.some(f => upperSymbol.startsWith(f) || upperSymbol.endsWith(f))) {
          const base = upperSymbol.substring(0, 3);
          const quote = upperSymbol.substring(3, 6);
          if (fiatCurrencies.includes(base) && fiatCurrencies.includes(quote)) {
            return `FOREX:${base}`;
          }
        }
        
        // Default: return as-is (stock symbol)
        return upperSymbol;
      };
      
      for (const keyword of keywordArray) {
        const trimmedKeyword = keyword.trim();
        const lowerKeyword = trimmedKeyword.toLowerCase();
        
        // Check if it's a valid topic
        if (validTopics.includes(lowerKeyword)) {
          topics.push(trimmedKeyword);
        } else {
          // Format the ticker (handles crypto, forex, stocks)
          const formattedTicker = formatTicker(trimmedKeyword);
          tickers.push(formattedTicker);
        }
      }

      // Helper function to make a single API call
      const makeApiCall = async (tickersParam, topicsParam) => {
        const params = new URLSearchParams({
          function: 'NEWS_SENTIMENT',
          apikey: this.apiKey,
          sort: 'LATEST',
          limit: limit.toString()
        });

        if (tickersParam && tickersParam.length > 0) {
          params.append('tickers', tickersParam.join(','));
        }
        
        if (topicsParam && topicsParam.length > 0) {
          params.append('topics', topicsParam.join(','));
        }

        const url = `${this.baseUrl}?${params.toString()}`;
        console.log(`Fetching Alpha Vantage news: ${url}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Check for API errors
        if (data['Error Message']) {
          console.error('Alpha Vantage API Error:', data['Error Message']);
          throw new Error(data['Error Message']);
        }
        
        if (data['Note']) {
          console.warn('Alpha Vantage API Note:', data['Note']);
          throw new Error(`API rate limit: ${data['Note']}`);
        }

        if (data['Information']) {
          console.warn('Alpha Vantage API Information:', data['Information']);
          throw new Error(`API information: ${data['Information']}`);
        }

        return data.feed || [];
      };

      // IMPORTANT: Alpha Vantage uses AND logic when both tickers and topics are provided
      // This means it only returns articles matching BOTH, which often results in no matches
      // Solution: Make separate calls and combine results (OR logic)
      let allArticles = [];
      let rawResponses = [];

      // If we have both tickers and topics, make separate calls to get better results
      if (tickers.length > 0 && topics.length > 0) {
        console.log(`Making separate API calls: one for tickers (${tickers.join(',')}) and one for topics (${topics.join(',')})`);
        
        // Call 1: Tickers only
        try {
          const tickerFeed = await makeApiCall(tickers, null);
          console.log(`Received ${tickerFeed.length} articles from tickers query`);
          allArticles.push(...tickerFeed);
        } catch (error) {
          console.warn(`Error fetching tickers news: ${error.message}`);
        }

        // Call 2: Topics only
        try {
          const topicFeed = await makeApiCall(null, topics);
          console.log(`Received ${topicFeed.length} articles from topics query`);
          allArticles.push(...topicFeed);
        } catch (error) {
          console.warn(`Error fetching topics news: ${error.message}`);
        }

        // Deduplicate articles by URL
        const seenUrls = new Set();
        const uniqueArticles = [];
        for (const article of allArticles) {
          const url = article.url || article.title || '';
          if (url && !seenUrls.has(url)) {
            seenUrls.add(url);
            uniqueArticles.push(article);
          }
        }
        allArticles = uniqueArticles;
        console.log(`Combined and deduplicated: ${allArticles.length} unique articles`);
      } else if (tickers.length > 0) {
        // Only tickers
        console.log(`Fetching Alpha Vantage news for tickers: ${tickers.join(',')}`);
        allArticles = await makeApiCall(tickers, null);
        console.log(`Received ${allArticles.length} articles from tickers query`);
      } else if (topics.length > 0) {
        // Only topics
        console.log(`Fetching Alpha Vantage news for topics: ${topics.join(',')}`);
        allArticles = await makeApiCall(null, topics);
        console.log(`Received ${allArticles.length} articles from topics query`);
      } else {
        // Fallback: use first keyword as ticker
        if (keywordArray.length > 0) {
          const fallbackTicker = keywordArray[0].trim().toUpperCase();
          console.log(`Fetching Alpha Vantage news for ticker (fallback): ${fallbackTicker}`);
          allArticles = await makeApiCall([fallbackTicker], null);
          console.log(`Received ${allArticles.length} articles from fallback query`);
        }
      }

      // Limit to requested limit
      allArticles = allArticles.slice(0, limit);
      
      // If no articles, log the request details for debugging
      if (allArticles.length === 0) {
        console.warn('No articles found. Request details:', {
          tickers: tickers.length > 0 ? tickers.join(',') : 'none',
          topics: topics.length > 0 ? topics.join(',') : 'none',
          limit: limit
        });
      }

      const articles = allArticles.map(article => {
        // Alpha Vantage provides sentiment scores directly
        const sentiment = article.overall_sentiment_score || 0;
        const sentimentLabel = article.overall_sentiment_label || 'NEUTRAL';
        
        // Convert Alpha Vantage sentiment to our format
        let label = 'neutral';
        if (sentiment > 0.35) {
          label = 'positive';
        } else if (sentiment < -0.35) {
          label = 'negative';
        }

        return {
          title: article.title || '',
          description: article.summary || '',
          url: article.url || '',
          publishedAt: article.time_published || new Date().toISOString(),
          source: article.source || 'Alpha Vantage',
          content: article.summary || '',
          // Alpha Vantage provides sentiment data
          sentiment: {
            overall: label,
            score: sentiment,
            label: sentimentLabel,
            method: 'alphavantage'
          },
          // Additional Alpha Vantage fields
          ticker_sentiment: article.ticker_sentiment || [],
          topics: article.topics || []
        };
      });

      // Combine raw responses if we made multiple calls
      const rawResponse = {
        feed: allArticles,
        note: allArticles.length === 0 ? 'No articles found. Try using only tickers or only topics for better results.' : undefined
      };

      return { articles, rawResponse };
    } catch (error) {
      console.error('Error fetching Alpha Vantage news:', error);
      return { articles: [], rawResponse: null };
    }
  }

  /**
   * Analyze sentiment of an article
   * If article already has sentiment from Alpha Vantage, use it; otherwise analyze
   */
  analyzeArticle(article) {
    // If article already has sentiment from Alpha Vantage, use it
    if (article.sentiment && article.sentiment.method === 'alphavantage') {
      return article;
    }

    // Otherwise, analyze using keyword matching
    const text = `${article.title} ${article.description} ${article.content}`.substring(0, 1000);
    const sentiment = this.analyzeSentiment(text);

    return {
      ...article,
      sentiment: {
        overall: sentiment.label,
        score: sentiment.score,
        positiveCount: sentiment.positiveCount,
        negativeCount: sentiment.negativeCount,
        method: sentiment.method
      }
    };
  }

  /**
   * Main method to fetch and analyze sentiment for any keywords using Alpha Vantage
   */
  async getSentimentAnalysis(keywords, daysBack = 7, maxResults = 30) {
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];

    console.log(`Fetching sentiment analysis for keywords: ${keywordArray.join(', ')}`);

    // If no API key, return error
    if (!this.apiKey) {
      return {
        timestamp: new Date().toISOString(),
        keywords: keywordArray,
        total_articles: 0,
        overall_sentiment: 'NO_DATA',
        average_sentiment_score: 0,
        sentiment_distribution: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        articles: [],
        raw_alpha_vantage_response: null,
        warning: 'Alpha Vantage API key is required. Please configure it in Settings > Alpha Vantage Configuration.'
      };
    }

    // Fetch from Alpha Vantage News & Sentiment API
    console.log('Fetching from Alpha Vantage News & Sentiment API...');
    const { articles, rawResponse } = await this.fetchAlphaVantageNews(keywordArray, maxResults);
    console.log(`Found ${articles.length} articles from Alpha Vantage`);

    // Remove duplicates based on URL
    const seenUrls = new Set();
    const uniqueArticles = [];
    for (const article of articles) {
      if (article.url && !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueArticles.push(article);
      } else if (!article.url) {
        // Include articles without URLs if they have unique titles
        const titleKey = article.title?.toLowerCase() || '';
        if (titleKey && !seenUrls.has(titleKey)) {
          seenUrls.add(titleKey);
          uniqueArticles.push(article);
        }
      }
    }

    // Limit to maxResults
    const limitedArticles = uniqueArticles.slice(0, maxResults);

    console.log(`Processing ${limitedArticles.length} unique articles...`);

    // If no articles found, provide helpful message
    if (limitedArticles.length === 0) {
      return {
        timestamp: new Date().toISOString(),
        keywords: keywordArray,
        total_articles: 0,
        overall_sentiment: 'NO_DATA',
        average_sentiment_score: 0,
        sentiment_distribution: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        articles: [],
        raw_alpha_vantage_response: rawResponse,
        warning: 'No articles found. Try different keywords or check if Alpha Vantage API is working correctly.'
      };
    }

    // Articles from Alpha Vantage already have sentiment scores, but ensure they're analyzed
    const analyzedArticles = [];
    const sentimentScores = [];

    for (const article of limitedArticles) {
      const analyzed = this.analyzeArticle(article);
      analyzedArticles.push(analyzed);
      // Use the sentiment score from Alpha Vantage if available
      sentimentScores.push(analyzed.sentiment?.score || 0);
    }

    // Calculate overall sentiment statistics
    let avgSentiment = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let overallSentiment = 'NO_DATA';

    if (sentimentScores.length > 0) {
      avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
      // Alpha Vantage uses -1 to 1 scale, so adjust thresholds
      positiveCount = sentimentScores.filter(s => s > 0.35).length;
      negativeCount = sentimentScores.filter(s => s < -0.35).length;
      neutralCount = sentimentScores.length - positiveCount - negativeCount;

      if (avgSentiment > 0.1) {
        overallSentiment = 'BULLISH';
      } else if (avgSentiment < -0.1) {
        overallSentiment = 'BEARISH';
      } else {
        overallSentiment = 'NEUTRAL';
      }
    }

    return {
      timestamp: new Date().toISOString(),
      keywords: keywordArray,
      total_articles: analyzedArticles.length,
      overall_sentiment: overallSentiment,
      average_sentiment_score: Math.round(avgSentiment * 1000) / 1000,
      sentiment_distribution: {
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount
      },
      articles: analyzedArticles,
      raw_alpha_vantage_response: rawResponse // Include raw API response
    };
  }
}

module.exports = SentimentAnalyzer;

