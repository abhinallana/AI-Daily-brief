import logging
from datetime import date
from collections import defaultdict, Counter
from typing import List, Dict
from app.config.config import config
from app.collectors.rss import RSSCollector
from app.domain.entities import Article, DailyReport
from app.services.insight_gen import InsightGeneratorService

logger = logging.getLogger(__name__)

class ReportBuilderService:
    def __init__(self, article_repo) -> None:
        self.repo = article_repo
        self.insight_gen = InsightGeneratorService()

    def build_daily_report(self) -> DailyReport:
        """Executes the daily briefing pipeline and returns a unified DailyReport object."""
        today = date.today()
        # Check cache database first
        cached_report = self.repo.get_daily_report(today)
        if cached_report:
            logger.info(f"DailyReport for {today} already exists in database. Returning cached report.")
            return cached_report

        logger.info("Executing daily report building use case...")
        
        # 1. Fetch from RSS Feeds
        all_collected_articles = []
        for feed_url in config.RSS_FEEDS:
            collector = RSSCollector(feed_url)
            articles = collector.fetch_articles()
            all_collected_articles.extend(articles)

        # 2. Filter out duplicates using link hashes
        new_articles = []
        for art in all_collected_articles:
            # Map collector models to domain models if needed (we mapped models inside collector, but since they have identical signatures they parse cleanly)
            # Recreate Article to compute hash if needed
            domain_art = Article(
                title=art.title,
                link=art.link,
                published_at=art.published_at,
                summary=art.summary,
                source=art.source
            )
            if not self.repo.is_duplicate(domain_art.link):
                new_articles.append(domain_art)

        if new_articles:
            logger.info(f"Analyzing {len(new_articles)} new articles...")
            # 3. Analyze articles in batches
            analyzed_articles = self.insight_gen.analyze_articles(new_articles)
            
            logger.info(f"Saving {len(analyzed_articles)} articles to database...")
            self.repo.save_articles(analyzed_articles)
        else:
            logger.info("No new articles to analyze.")

        # 4. Fetch recent relevant articles to balance and build report
        recent_articles = self.repo.get_recent_articles(limit=40, only_relevant=True)
        
        if not recent_articles:
            logger.warning("No recent relevant articles found. Building empty report.")
            return DailyReport(
                report_date=date.today(),
                biggest_announcement="No major updates today.",
                biggest_trend="No major trends observed.",
                one_thing_to_know="Stay tuned for tomorrow's updates.",
                time_saved_minutes=0,
                articles=[]
            )

        # 5. Source balancing (round-robin)
        articles_by_source = defaultdict(list)
        for article in recent_articles:
            articles_by_source[article.source].append(article)
            
        balanced_articles = []
        sources = list(articles_by_source.keys())
        indices = {source: 0 for source in sources}
        
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

        # Sort selected balanced articles: Strategic -> Important -> Insights (mapping Informational)
        priority_order = {"Strategic": 1, "Important": 2, "Insights": 3, "Informational": 3}
        balanced_articles.sort(key=lambda art: priority_order.get(art.priority or "Insights", 3))

        # 6. Generate overall report takeaways
        logger.info("Synthesizing Today's Takeaways from final selection...")
        takeaways = self.insight_gen.generate_takeaways(balanced_articles)

        # 7. Build and return DailyReport domain object
        report = DailyReport(
            report_date=date.today(),
            biggest_announcement=takeaways.biggest_announcement,
            biggest_trend=takeaways.biggest_trend,
            one_thing_to_know=takeaways.one_thing_to_know,
            reading_time_saved_minutes=takeaways.reading_time_saved_minutes,
            articles=balanced_articles
        )
        
        # Save the report for subsequent fast loads
        self.repo.save_daily_report(report)
        return report
