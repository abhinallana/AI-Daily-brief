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
        
        # Run new articles through the AI summarizer in batch
        analyzed_articles = summarizer.analyze_articles(new_articles)

            
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
            
    # Retrieve recent relevant articles (fetch a larger pool to allow source balancing)
    recent_articles = db.get_recent_articles(limit=40, only_relevant=True)
    
    if recent_articles:
        logger.info(f"Retrieved {len(recent_articles)} articles from database. Balancing sources...")
        
        # Group by source to ensure diversity
        articles_by_source = defaultdict(list)
        for article in recent_articles:
            articles_by_source[article.source].append(article)
            
        # Select articles round-robin from each source
        balanced_articles = []
        sources = list(articles_by_source.keys())
        indices = {source: 0 for source in sources}
        
        # Loop until we collect 12 articles or exhaust all available items
        while len(balanced_articles) < 12:
            added_in_round = False
            for source in sources:
                idx = indices[source]
                if idx < len(articles_by_source[source]):
                    balanced_articles.append(articles_by_source[source][idx])
                    indices[source] += 1
                    added_in_round = True
                    if len(balanced_articles) == 12:
                        break
            if not added_in_round:
                break
                
        # Sort the final 12 articles by priority: Strategic -> Important -> Informational
        priority_order = {"Strategic": 1, "Important": 2, "Informational": 3}
        balanced_articles.sort(key=lambda art: priority_order.get(art.priority or "Informational", 3))
        
        logger.info(f"Generating OpsiAI briefing containing {len(balanced_articles)} balanced articles...")
        
        # Group articles by priority for templates
        grouped = defaultdict(list)
        for article in balanced_articles:
            priority = article.priority or "Informational"
            grouped[priority].append(article)
            
        # Send Email Briefing
        date_str = datetime.now().strftime("%B %d, %Y")
        email_service = EmailService()
        email_service.send_briefing(date_str, dict(grouped), balanced_articles)
    else:
        logger.info("No recent relevant articles found. Skipping OpsiAI email briefing.")

if __name__ == "__main__":
    main()
