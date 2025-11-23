"""
Market News and Sentiment Analysis Tool
=========================================

A comprehensive Python script that groups all Alpha Vantage market news 
and sentiment analysis functions into a single, easy-to-use interface.

Features:
- Fetch market news by tickers, topics, or date ranges
- Analyze sentiment scores and labels
- Filter and sort news articles
- Export results to JSON or formatted text
- Command-line interface for easy usage
- Programmatic API for integration

Usage:
    # Command line
    python market_news_sentiment_analyzer.py --tickers AAPL --topics technology
    
    # Programmatic
    from market_news_sentiment_analyzer import MarketNewsAnalyzer
    analyzer = MarketNewsAnalyzer()
    news = analyzer.get_news_by_ticker("AAPL")
"""

import os
import json
import logging
import argparse
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Supported topics for Alpha Vantage API
SUPPORTED_TOPICS = [
    "blockchain",
    "earnings",
    "ipo",
    "mergers_and_acquisitions",
    "financial_markets",
    "economy_fiscal",
    "economy_monetary",
    "economy_macro",
    "energy_transportation",
    "finance",
    "life_sciences",
    "manufacturing",
    "real_estate",
    "retail_wholesale",
    "technology"
]

# Sort options
SORT_OPTIONS = ["LATEST", "EARLIEST", "RELEVANCE"]


def parse_date_to_standard(date_str: str) -> str:
    """
    Convert various date formats to standard format (YYYY-MM-DD HH:MM:SS)
    
    Args:
        date_str: Date string in various formats
        
    Returns:
        Standard format datetime string
    """
    if not date_str or date_str == "unknown":
        return "unknown"

    # Handle Alpha Vantage format: "20250410T0130" or "20251105T121200"
    try:
        if "T" in date_str:
            date_part = date_str.split("T")[0]
            time_part = date_str.split("T")[1]
            if len(date_part) == 8:
                if len(time_part) == 6:
                    parsed_date = datetime.strptime(date_str, "%Y%m%dT%H%M%S")
                    return parsed_date.strftime("%Y-%m-%d %H:%M:%S")
                elif len(time_part) == 4:
                    parsed_date = datetime.strptime(date_str, "%Y%m%dT%H%M")
                    return parsed_date.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass

    # Handle ISO 8601 format
    try:
        if "T" in date_str:
            if "+" in date_str:
                date_part = date_str.split("+")[0]
            elif "Z" in date_str:
                date_part = date_str.replace("Z", "")
            else:
                date_part = date_str

            if "." in date_part:
                parsed_date = datetime.strptime(date_part.split(".")[0], "%Y-%m-%dT%H:%M:%S")
            else:
                parsed_date = datetime.strptime(date_part, "%Y-%m-%dT%H:%M:%S")
            return parsed_date.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass

    # Handle standard format "YYYY-MM-DD HH:MM:SS"
    try:
        if " " in date_str and len(date_str) >= 19:
            parsed_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
            return parsed_date.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass

    # Handle date-only format "YYYY-MM-DD"
    try:
        if len(date_str) == 10 and date_str.count("-") == 2:
            parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
            return parsed_date.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass

    return date_str


def convert_to_alphavantage_date(date_str: str) -> str:
    """
    Convert date string to Alpha Vantage format (YYYYMMDDTHHMM)
    
    Args:
        date_str: Date in format "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
        
    Returns:
        Date in Alpha Vantage format "YYYYMMDDTHHMM"
    """
    try:
        if " " in date_str:
            dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        else:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y%m%dT%H%M")
    except Exception as e:
        logger.error(f"Failed to convert date: {e}")
        raise ValueError(f"Invalid date format: {date_str}")


class MarketNewsAnalyzer:
    """
    Main class for market news and sentiment analysis using Alpha Vantage API
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the analyzer
        
        Args:
            api_key: Alpha Vantage API key. If not provided, reads from ALPHAADVANTAGE_API_KEY env var
        """
        self.api_key = api_key or os.environ.get("ALPHAADVANTAGE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Alpha Vantage API key not provided! "
                "Please set ALPHAADVANTAGE_API_KEY environment variable or pass api_key parameter."
            )
        self.base_url = "https://www.alphavantage.co/query"
    
    def fetch_news(
        self,
        tickers: Optional[str] = None,
        topics: Optional[str] = None,
        time_from: Optional[str] = None,
        time_to: Optional[str] = None,
        sort: str = "LATEST",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Fetch news articles from Alpha Vantage NEWS_SENTIMENT API
        
        Args:
            tickers: Stock/crypto/forex symbols (e.g., "AAPL" or "COIN,CRYPTO:BTC,FOREX:USD")
            topics: News topics (e.g., "technology" or "technology,ipo")
            time_from: Start time in YYYYMMDDTHHMM format or "YYYY-MM-DD" format
            time_to: End time in YYYYMMDDTHHMM format or "YYYY-MM-DD" format
            sort: Sort order ("LATEST", "EARLIEST", or "RELEVANCE")
            limit: Maximum number of articles to return (default: 20, max: 1000)
            
        Returns:
            List of news articles with sentiment data
        """
        params = {
            "function": "NEWS_SENTIMENT",
            "apikey": self.api_key,
            "sort": sort,
            "limit": min(limit, 1000)  # API max is 1000
        }
        
        if tickers:
            params["tickers"] = tickers
        if topics:
            params["topics"] = topics
        
        # Convert date formats if needed
        if time_from and "-" in time_from:
            time_from = convert_to_alphavantage_date(time_from)
        if time_to and "-" in time_to:
            time_to = convert_to_alphavantage_date(time_to)
            
        if time_from:
            params["time_from"] = time_from
        if time_to:
            params["time_to"] = time_to
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            
            json_data = response.json()
            
            # Check for API errors
            if "Error Message" in json_data:
                raise Exception(f"Alpha Vantage API error: {json_data['Error Message']}")
            if "Note" in json_data:
                raise Exception(f"Alpha Vantage API note: {json_data['Note']}")
            
            # Extract feed data
            feed = json_data.get("feed", [])
            
            if not feed:
                logger.warning("Alpha Vantage API returned empty feed")
                return []
            
            return feed[:params["limit"]]
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Alpha Vantage API request failed: {e}")
            raise Exception(f"Alpha Vantage API request failed: {e}")
        except Exception as e:
            logger.error(f"Alpha Vantage API error: {e}")
            raise
    
    def get_news_by_ticker(
        self,
        ticker: str,
        days_back: int = 7,
        sort: str = "LATEST",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get news for a specific ticker
        
        Args:
            ticker: Stock symbol (e.g., "AAPL")
            days_back: Number of days to look back (default: 7)
            sort: Sort order (default: "LATEST")
            limit: Maximum number of articles (default: 20)
            
        Returns:
            List of news articles
        """
        time_to = datetime.now()
        time_from = time_to - timedelta(days=days_back)
        
        return self.fetch_news(
            tickers=ticker,
            time_from=time_from.strftime("%Y-%m-%d"),
            time_to=time_to.strftime("%Y-%m-%d"),
            sort=sort,
            limit=limit
        )
    
    def get_news_by_topic(
        self,
        topic: str,
        days_back: int = 7,
        sort: str = "LATEST",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get news for a specific topic
        
        Args:
            topic: News topic (e.g., "technology")
            days_back: Number of days to look back (default: 7)
            sort: Sort order (default: "LATEST")
            limit: Maximum number of articles (default: 20)
            
        Returns:
            List of news articles
        """
        if topic not in SUPPORTED_TOPICS:
            logger.warning(f"Topic '{topic}' may not be supported. Supported topics: {SUPPORTED_TOPICS}")
        
        time_to = datetime.now()
        time_from = time_to - timedelta(days=days_back)
        
        return self.fetch_news(
            topics=topic,
            time_from=time_from.strftime("%Y-%m-%d"),
            time_to=time_to.strftime("%Y-%m-%d"),
            sort=sort,
            limit=limit
        )
    
    def get_news_by_date_range(
        self,
        start_date: str,
        end_date: str,
        tickers: Optional[str] = None,
        topics: Optional[str] = None,
        sort: str = "LATEST",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get news for a specific date range
        
        Args:
            start_date: Start date in "YYYY-MM-DD" format
            end_date: End date in "YYYY-MM-DD" format
            tickers: Optional ticker filter
            topics: Optional topic filter
            sort: Sort order (default: "LATEST")
            limit: Maximum number of articles (default: 20)
            
        Returns:
            List of news articles
        """
        return self.fetch_news(
            tickers=tickers,
            topics=topics,
            time_from=start_date,
            time_to=end_date,
            sort=sort,
            limit=limit
        )
    
    def analyze_sentiment(
        self,
        articles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze sentiment from a list of articles
        
        Args:
            articles: List of news articles
            
        Returns:
            Dictionary with sentiment statistics
        """
        if not articles:
            return {
                "total_articles": 0,
                "average_sentiment": 0,
                "sentiment_distribution": {},
                "ticker_sentiment": {}
            }
        
        sentiment_scores = []
        sentiment_labels = {}
        ticker_sentiments = {}
        
        for article in articles:
            # Overall sentiment
            score = article.get("overall_sentiment_score", 0)
            label = article.get("overall_sentiment_label", "Unknown")
            
            if score:
                sentiment_scores.append(float(score))
                sentiment_labels[label] = sentiment_labels.get(label, 0) + 1
            
            # Ticker sentiment
            ticker_sentiment = article.get("ticker_sentiment", [])
            for ticker_info in ticker_sentiment:
                ticker = ticker_info.get("ticker", "Unknown")
                ticker_score = ticker_info.get("ticker_sentiment_score", 0)
                ticker_label = ticker_info.get("ticker_sentiment_label", "Unknown")
                
                if ticker not in ticker_sentiments:
                    ticker_sentiments[ticker] = {
                        "scores": [],
                        "labels": {}
                    }
                
                if ticker_score:
                    ticker_sentiments[ticker]["scores"].append(float(ticker_score))
                ticker_sentiments[ticker]["labels"][ticker_label] = \
                    ticker_sentiments[ticker]["labels"].get(ticker_label, 0) + 1
        
        # Calculate averages
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
        
        # Calculate ticker averages
        ticker_averages = {}
        for ticker, data in ticker_sentiments.items():
            avg = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
            ticker_averages[ticker] = {
                "average_sentiment": avg,
                "label_distribution": data["labels"]
            }
        
        return {
            "total_articles": len(articles),
            "average_sentiment": avg_sentiment,
            "sentiment_distribution": sentiment_labels,
            "ticker_sentiment": ticker_averages
        }
    
    def format_article(self, article: Dict[str, Any], include_details: bool = True) -> str:
        """
        Format a single article for display
        
        Args:
            article: Article dictionary
            include_details: Whether to include detailed sentiment info
            
        Returns:
            Formatted string
        """
        title = article.get("title", "N/A")
        url = article.get("url", "N/A")
        summary = article.get("summary", "N/A")
        time_published = article.get("time_published", "unknown")
        source = article.get("source", "N/A")
        
        # Format time
        time_formatted = parse_date_to_standard(time_published)
        
        result = f"""
{'='*80}
Title: {title}
Source: {source}
Published: {time_formatted}
URL: {url}
{'='*80}
Summary: {summary[:500]}...
"""
        
        if include_details:
            # Overall sentiment
            overall_sentiment = article.get("overall_sentiment_score", "N/A")
            sentiment_label = article.get("overall_sentiment_label", "N/A")
            result += f"\nOverall Sentiment: {sentiment_label} (score: {overall_sentiment})"
            
            # Ticker sentiment
            ticker_sentiment = article.get("ticker_sentiment", [])
            if ticker_sentiment:
                result += "\n\nTicker Sentiment:"
                for ticker_info in ticker_sentiment:
                    ticker = ticker_info.get("ticker", "N/A")
                    relevance = ticker_info.get("relevance_score", "N/A")
                    sentiment_score = ticker_info.get("ticker_sentiment_score", "N/A")
                    sentiment_label_ticker = ticker_info.get("ticker_sentiment_label", "N/A")
                    result += f"\n  - {ticker}: relevance={relevance}, sentiment={sentiment_score} ({sentiment_label_ticker})"
            
            # Topics
            topics_list = article.get("topics", [])
            if topics_list:
                topics_str = ", ".join([topic.get("topic", "") for topic in topics_list])
                result += f"\n\nTopics: {topics_str}"
        
        return result
    
    def format_articles(
        self,
        articles: List[Dict[str, Any]],
        include_details: bool = True
    ) -> str:
        """
        Format multiple articles for display
        
        Args:
            articles: List of article dictionaries
            include_details: Whether to include detailed sentiment info
            
        Returns:
            Formatted string with all articles
        """
        if not articles:
            return "No articles found."
        
        formatted = [f"Found {len(articles)} articles:\n"]
        for i, article in enumerate(articles, 1):
            formatted.append(f"\n--- Article {i} ---")
            formatted.append(self.format_article(article, include_details))
        
        return "\n".join(formatted)
    
    def export_to_json(
        self,
        articles: List[Dict[str, Any]],
        filename: str
    ) -> None:
        """
        Export articles to JSON file
        
        Args:
            articles: List of article dictionaries
            filename: Output filename
        """
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        logger.info(f"Exported {len(articles)} articles to {filename}")
    
    def export_to_text(
        self,
        articles: List[Dict[str, Any]],
        filename: str,
        include_details: bool = True
    ) -> None:
        """
        Export articles to text file
        
        Args:
            articles: List of article dictionaries
            filename: Output filename
            include_details: Whether to include detailed sentiment info
        """
        with open(filename, "w", encoding="utf-8") as f:
            f.write(self.format_articles(articles, include_details))
        logger.info(f"Exported {len(articles)} articles to {filename}")


def main():
    """Command-line interface"""
    parser = argparse.ArgumentParser(
        description="Market News and Sentiment Analysis Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Get news for Apple stock
  python market_news_sentiment_analyzer.py --tickers AAPL
  
  # Get technology news
  python market_news_sentiment_analyzer.py --topics technology
  
  # Get news for multiple tickers
  python market_news_sentiment_analyzer.py --tickers "AAPL,MSFT,GOOGL"
  
  # Get news with date range
  python market_news_sentiment_analyzer.py --tickers AAPL --start-date 2025-01-01 --end-date 2025-01-15
  
  # Export to JSON
  python market_news_sentiment_analyzer.py --tickers AAPL --export-json news.json
  
  # Analyze sentiment
  python market_news_sentiment_analyzer.py --tickers AAPL --analyze-sentiment
        """
    )
    
    parser.add_argument(
        "--tickers",
        type=str,
        help="Stock/crypto/forex symbols (e.g., 'AAPL' or 'AAPL,MSFT,CRYPTO:BTC')"
    )
    parser.add_argument(
        "--topics",
        type=str,
        help=f"News topics (e.g., 'technology' or 'technology,ipo'). Supported: {', '.join(SUPPORTED_TOPICS)}"
    )
    parser.add_argument(
        "--start-date",
        type=str,
        help="Start date in YYYY-MM-DD format"
    )
    parser.add_argument(
        "--end-date",
        type=str,
        help="End date in YYYY-MM-DD format"
    )
    parser.add_argument(
        "--days-back",
        type=int,
        default=7,
        help="Number of days to look back (default: 7)"
    )
    parser.add_argument(
        "--sort",
        type=str,
        choices=SORT_OPTIONS,
        default="LATEST",
        help=f"Sort order (default: LATEST). Options: {', '.join(SORT_OPTIONS)}"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum number of articles (default: 20, max: 1000)"
    )
    parser.add_argument(
        "--export-json",
        type=str,
        help="Export results to JSON file"
    )
    parser.add_argument(
        "--export-text",
        type=str,
        help="Export results to text file"
    )
    parser.add_argument(
        "--analyze-sentiment",
        action="store_true",
        help="Show sentiment analysis statistics"
    )
    parser.add_argument(
        "--no-details",
        action="store_true",
        help="Don't include detailed sentiment information in output"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="Alpha Vantage API key (overrides environment variable)"
    )
    
    args = parser.parse_args()
    
    # Initialize analyzer
    try:
        analyzer = MarketNewsAnalyzer(api_key=args.api_key)
    except ValueError as e:
        print(f"Error: {e}")
        return 1
    
    # Fetch news
    try:
        if args.start_date and args.end_date:
            articles = analyzer.get_news_by_date_range(
                args.start_date,
                args.end_date,
                tickers=args.tickers,
                topics=args.topics,
                sort=args.sort,
                limit=args.limit
            )
        elif args.tickers:
            articles = analyzer.get_news_by_ticker(
                args.tickers,
                days_back=args.days_back,
                sort=args.sort,
                limit=args.limit
            )
        elif args.topics:
            articles = analyzer.get_news_by_topic(
                args.topics,
                days_back=args.days_back,
                sort=args.sort,
                limit=args.limit
            )
        else:
            print("Error: Must specify --tickers, --topics, or --start-date/--end-date")
            parser.print_help()
            return 1
        
        if not articles:
            print("No articles found.")
            return 0
        
        # Display results
        print(f"\nFound {len(articles)} articles\n")
        print(analyzer.format_articles(articles, include_details=not args.no_details))
        
        # Analyze sentiment if requested
        if args.analyze_sentiment:
            print("\n" + "="*80)
            print("SENTIMENT ANALYSIS")
            print("="*80)
            sentiment_stats = analyzer.analyze_sentiment(articles)
            print(json.dumps(sentiment_stats, indent=2))
        
        # Export if requested
        if args.export_json:
            analyzer.export_to_json(articles, args.export_json)
        
        if args.export_text:
            analyzer.export_to_text(
                articles,
                args.export_text,
                include_details=not args.no_details
            )
        
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        logger.exception("Error fetching news")
        return 1


if __name__ == "__main__":
    exit(main())

