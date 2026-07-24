from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import date
from typing import List, Optional
from app.config.config import config
from app.domain.entities import Article, DailyReport
from app.infrastructure.database.repository import get_repository
from app.services.report_builder import ReportBuilderService

router = APIRouter()

from app.infrastructure.database.repository import get_repository
from app.services.report_builder import ReportBuilderService
from app.delivery.email import EmailService
from fastapi import Header

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

@router.get("/reports")
def get_all_reports(repo=Depends(get_repo)):
    """Fetches list of all generated daily reports (dates, announcements)."""
    return repo.get_all_daily_reports()

@router.get("/reports/{report_date}")
def get_report_by_date(report_date: str, repo=Depends(get_repo)):
    """Fetches a specific daily report briefing by date."""
    try:
        query_date = date.fromisoformat(report_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Expected YYYY-MM-DD."
        )
    
    report = repo.get_daily_report(query_date)
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Report for date {report_date} not found."
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
    limit: int = Query(100, ge=1, le=200),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    """Fetches paginated, filtered, and searched historical articles."""
    if q or from_date or to_date:
        articles = repo.search_articles(query=q, from_date=from_date, to_date=to_date, limit=limit)
    else:
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

@router.get("/articles/counts")
def get_weekly_article_counts(repo=Depends(get_repo)):
    """Fetches weekly article counts per category/topic from the last 7 days."""
    return repo.get_weekly_topic_counts()

@router.get("/metrics")
def get_opsi_metrics(repo=Depends(get_repo)):
    """Fetches real-time OpsiAI metrics for the landing page."""
    return repo.get_metrics()

from pydantic import BaseModel

class UserPreferencesPayload(BaseModel):
    email: str
    subscribed_topics: List[str]
    delivery_time: Optional[str] = None

@router.post("/users/preferences")
def save_user_preferences(payload: UserPreferencesPayload, repo=Depends(get_repo)):
    """Saves subscriber preferences to the database repository."""
    repo.save_user_preferences(payload.email, payload.subscribed_topics)
    if payload.delivery_time:
        repo.update_user_delivery_time(payload.email, payload.delivery_time)
    return {"status": "success", "message": "Preferences saved."}

@router.get("/users/preferences")
def get_user_preferences(email: str, repo=Depends(get_repo)):
    """Fetches subscriber preferences from the database repository."""
    topics = repo.get_user_preferences(email)
    return {"email": email, "subscribed_topics": topics}

class UserProfilePayload(BaseModel):
    id: str
    first_name: str
    last_name: Optional[str] = None
    email: str
    avatar_url: Optional[str] = None
    newsletter_enabled: Optional[bool] = False
    preferred_topics: Optional[str] = ""
    theme: Optional[str] = "dark"
    delivery_time: Optional[str] = "03:00 PM"

@router.post("/users/profiles")
def save_user_profile(payload: UserProfilePayload, repo=Depends(get_repo)):
    """Saves or updates user profiles in the database repository."""
    repo.save_user_profile(payload.model_dump())
    return {"status": "success", "message": "User profile saved."}

@router.get("/users/profiles/{profile_id}")
def get_user_profile(profile_id: str, repo=Depends(get_repo)):
    """Fetches user profiles by ID from the database repository."""
    profile = repo.get_user_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return profile

@router.post("/trigger-delivery")
def trigger_delivery(
    delivery_time: str = Query("03:00 PM", description="The exact delivery_time string to match, e.g. '03:00 PM'"),
    x_cron_secret: str = Header(None, alias="X-Cron-Secret"),
    repo=Depends(get_repo)
):
    """Triggers the delivery for users subscribed to a specific delivery time."""
    cron_secret = getattr(config, "CRON_SECRET", None)
    if cron_secret and x_cron_secret != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized cron trigger.")
    
    # 1. Build the daily report
    builder = ReportBuilderService(repo)
    report = builder.build_daily_report()
    
    if not report.articles:
        return {"status": "success", "message": "No articles in report. Skipped delivery."}
        
    # 2. Get subscribers for this delivery time
    subscribers = repo.get_active_subscribers(delivery_time=delivery_time)
    
    if not subscribers:
        return {"status": "success", "message": f"No active subscribers found for delivery time {delivery_time}."}
        
    # 3. Trigger email delivery for these subscribers
    # We will override EmailService to ONLY fetch these subscribers, or just use the existing one but mock the fetch.
    # The existing EmailService fetches ALL subscribers from the repo internally. Let's fix that.
    # Actually, we should just let EmailService accept a list of subscribers!
    email_service = EmailService()
    success = email_service.send_briefing(report, custom_subscribers=subscribers)
    
    if success:
        return {"status": "success", "message": f"Delivered to {len(subscribers)} subscribers for {delivery_time}."}
    else:
        raise HTTPException(status_code=500, detail="Failed to deliver emails.")
