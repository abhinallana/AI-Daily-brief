import logging
from datetime import datetime
from collections import defaultdict
from app.config.config import config
from app.utils.logging import setup_logging
from app.collectors.rss import RSSCollector
from app.database.db import DatabaseManager
from app.summarizer.gemini import GeminiSummarizer
from app.delivery.email import EmailService

def main() -> None:
    # Initialize logging using settings from config
    setup_logging(log_level=config.LOG_LEVEL)
    
    logger = logging.getLogger(__name__)
    logger.info("Starting AI Daily Briefing pipeline...")
    
    # Initialize database manager
    db = DatabaseManager(config.DATABASE_PATH)
    
    # Initialize Gemini Summarizer
    summarizer = GeminiSummarizer()
    
    # Process feeds
    for feed_url in config.RSS_FEEDS:
        collector = RSSCollector(feed_url)
        articles = collector.fetch_articles()
        
        # Filter out duplicates
        new_articles = [art for art in articles if not db.is_duplicate(art.link)]
        
        if not new_articles:
            logger.info(f"No new articles found from {feed_url}")
            continue
            
        logger.info(f"Found {len(new_articles)} new articles from {feed_url}. Processing AI summaries...")
        
        # Run new articles through the AI summarizer
        analyzed_articles = []
        for article in new_articles:
            analyzed = summarizer.analyze_article(article)
            analyzed_articles.append(analyzed)
            
        logger.info(f"Storing {len(analyzed_articles)} analyzed articles in database...")
        db.save_articles(analyzed_articles)
        
        # Display the first few new articles
        logger.info(f"--- New Articles from {feed_url} ---")
        for idx, article in enumerate(analyzed_articles[:3], start=1):
            status = "Relevant" if article.is_relevant else "Irrelevant"
            logger.info(f"{idx}. {article.title} [{status}]")
            logger.info(f"   Category: {article.category or 'N/A'}")
            logger.info(f"   AI Summary: {article.ai_summary or 'N/A'}")
            logger.info(f"   Link: {article.link}")
            logger.info("-" * 40)
            
    # Retrieve recent relevant articles for the daily brief email
    recent_articles = db.get_recent_articles(limit=25, only_relevant=True)
    
    if recent_articles:
        logger.info(f"Generating briefing containing {len(recent_articles)} recent relevant articles...")
        
        # Group articles by category
        grouped = defaultdict(list)
        for article in recent_articles:
            category = article.category or "General Tech Updates"
            grouped[category].append(article)
            
        # Send Email Briefing
        date_str = datetime.now().strftime("%B %d, %Y")
        email_service = EmailService()
        email_service.send_briefing(date_str, dict(grouped))
    else:
        logger.info("No recent relevant articles found. Skipping email briefing.")

if __name__ == "__main__":
    main()


