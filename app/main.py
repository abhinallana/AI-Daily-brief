import logging
from app.config.config import config
from app.utils.logging import setup_logging
from app.infrastructure.database.repository import SQLiteArticleRepository
from app.services.report_builder import ReportBuilderService
from app.delivery.email import EmailService

def main() -> None:
    # Initialize logging using settings from config
    setup_logging(log_level=config.LOG_LEVEL)
    
    logger = logging.getLogger(__name__)
    logger.info("Starting AI Daily Briefing clean architecture pipeline...")
    
    # 1. Initialize Infrastructure Database Repository
    repo = SQLiteArticleRepository(config.DATABASE_PATH)
    
    # 2. Initialize Application Report Builder Service
    builder = ReportBuilderService(repo)
    
    # 3. Execute report building use case
    report = builder.build_daily_report()
    
    # 4. Trigger delivery layer if we have articles
    if report.articles:
        logger.info("Dispatching email delivery for daily report...")
        email_service = EmailService()
        email_service.send_briefing(report)
    else:
        logger.info("No articles in report. Skipping delivery.")

if __name__ == "__main__":
    main()
