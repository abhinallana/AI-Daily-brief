import logging
import feedparser
import requests
from typing import List
from app.models.article import Article

logger = logging.getLogger(__name__)

class RSSCollector:
    def __init__(self, feed_url: str):
        self.feed_url = feed_url

    def fetch_articles(self) -> List[Article]:
        """Fetches and parses articles from the configured RSS feed."""
        logger.info(f"Fetching RSS feed from: {self.feed_url}")
        try:
            # We fetch using the requests library because it uses the local certifi CA bundle
            # which prevents macOS SSL certificate failures common in standard urllib.
            response = requests.get(self.feed_url, timeout=15)
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            # check if parsing succeeded
            if feed.bozo:
                logger.warning(f"Feedparser flagged an anomaly (bozo bit set) for {self.feed_url}: {feed.bozo_exception}")
            
            articles = []
            source_title = feed.feed.get("title", self.feed_url)
            
            for entry in feed.entries:
                title = entry.get("title", "No Title")
                link = entry.get("link", "")
                
                # Different feeds use different date attributes
                published_at = entry.get("published", entry.get("updated", "Unknown Date"))
                summary = entry.get("summary", entry.get("description", ""))
                
                if not link:
                    logger.debug(f"Skipping entry without link: {title}")
                    continue
                
                article = Article(
                    title=title,
                    link=link,
                    published_at=published_at,
                    summary=summary,
                    source=source_title
                )
                articles.append(article)
                
            logger.info(f"Successfully collected {len(articles)} articles from {source_title}")
            return articles
        except Exception as e:
            logger.error(f"Error fetching RSS feed from {self.feed_url}: {e}", exc_info=True)
            return []

