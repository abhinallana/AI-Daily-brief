from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import date
from typing import List, Optional
from app.config.config import config
from app.domain.entities import Article, DailyReport
from app.infrastructure.database.repository import get_repository
from app.services.report_builder import ReportBuilderService

router = APIRouter()

def get_repo():
    return get_repository()

@router.get("/health")
def health_check(repo=Depends(get_repo)):
    """API health status checking database responsiveness."""
    try:
        # Check simple DB query to confirm responsiveness
        repo.is_duplicate("https://opsiai.health-ping.check")
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )

@router.get("/reports/today")
def get_todays_report(repo=Depends(get_repo)):
    """Fetches today's daily briefing report, computing it if not yet generated."""
    today = date.today()
    report = repo.get_daily_report(today)
    
    if not report:
        # Fallback build report on demand
        builder = ReportBuilderService(repo)
        try:
            report = builder.build_daily_report()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate report: {str(e)}"
            )
            
    return {
        "date": report.report_date.isoformat(),
        "biggest_announcement": report.biggest_announcement,
        "biggest_trend": report.biggest_trend,
        "one_thing_to_know": report.one_thing_to_know,
        "time_saved_minutes": report.reading_time_saved_minutes,
        "articles": [
            {
                "title": art.title,
                "link": art.link,
                "published_at": art.published_at,
                "summary": art.summary,
                "source": art.source,
                "icon": art.icon,
                "ai_summary": art.ai_summary,
                "category": art.category,
                "priority": art.priority,
                "why_it_matters": art.why_it_matters,
                "reading_time": art.reading_time,
                "link_hash": art.link_hash
            }
            for art in report.articles
        ]
    }

@router.get("/articles")
def get_articles(
    repo=Depends(get_repo),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None)
):
    """Fetches paginated and filtered historical articles."""
    articles = repo.get_recent_articles(limit=limit, only_relevant=True)
    
    filtered = []
    for art in articles:
        if category and art.category and art.category.lower() != category.lower():
            continue
        if priority and art.priority and art.priority.lower() != priority.lower():
            continue
        filtered.append({
            "title": art.title,
            "link": art.link,
            "published_at": art.published_at,
            "summary": art.summary,
            "source": art.source,
            "icon": art.icon,
            "ai_summary": art.ai_summary,
            "category": art.category,
            "priority": art.priority,
            "why_it_matters": art.why_it_matters,
            "reading_time": art.reading_time,
            "link_hash": art.link_hash
        })
    return filtered
