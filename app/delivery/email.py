import os
import logging
import smtplib
import re
from copy import deepcopy
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Dict, List
from collections import Counter, defaultdict
from jinja2 import Environment, FileSystemLoader
from app.config.config import config
from app.domain.entities import DailyReport
from app.infrastructure.database.repository import get_repository

logger = logging.getLogger(__name__)

def extract_first_name(email: str) -> str:
    if not email:
        return "Reader"
    # Take username part before @
    local_part = email.split('@')[0]
    # Replace dots, underscores, hyphens with spaces
    normalized = local_part.replace('.', ' ').replace('_', ' ').replace('-', ' ')
    first_word = normalized.split()[0]
    
    # Strip common tech suffixes from the username to extract the first name
    for suffix in ["devops", "engineer", "admin", "tech", "cloud", "developer", "brief"]:
        if suffix in first_word.lower():
            idx = first_word.lower().find(suffix)
            if idx > 0:
                first_word = first_word[:idx]
                
    # Strip digits
    first_word = ''.join([c for c in first_word if c.isalpha()])
    return first_word.capitalize() if first_word else "Reader"

class EmailService:
    def __init__(self) -> None:
        self.smtp_host = config.SMTP_HOST
        self.smtp_port = config.SMTP_PORT
        self.smtp_username = config.SMTP_USERNAME
        self.smtp_password = config.SMTP_PASSWORD
        self.email_from = config.EMAIL_FROM
        self.email_to = config.EMAIL_TO

        # Initialize Jinja2 environment relative to the file's directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(current_dir, "templates")
        self.jinja_env = Environment(loader=FileSystemLoader(templates_dir))

    def _render_templates(self, report: DailyReport) -> tuple[str, str]:
        """Renders both the plaintext and HTML templates."""
        html_template = self.jinja_env.get_template("briefing.html")
        txt_template = self.jinja_env.get_template("briefing.txt")

        # Group articles by priority
        grouped = defaultdict(list)
        for article in report.articles:
            priority = article.priority or "Insights"
            if priority == "Informational":
                priority = "Insights"
            grouped[priority].append(article)

        # Compute Greeting Info
        recipient_emails = [e.strip() for e in self.email_to.split(",") if e.strip()]
        names = [extract_first_name(e) for e in recipient_emails]
        if not names:
            first_name = "Reader"
        elif len(names) == 1:
            first_name = names[0]
        elif len(names) == 2:
            first_name = f"{names[0]} & {names[1]}"
        else:
            first_name = ", ".join(names[:-1]) + f", & {names[-1]}"
        
        import zoneinfo
        try:
            tz = zoneinfo.ZoneInfo(config.TIMEZONE)
            local_now = datetime.now(tz)
        except Exception:
            local_now = datetime.now()
            
        current_hour = local_now.hour
        if current_hour < 12:
            greeting_time = "Good Morning"
        elif current_hour < 17:
            greeting_time = "Good Afternoon"
        else:
            greeting_time = "Good Evening"
        
        greeting_date = local_now.strftime("%d-%m-%Y")

        # Compute Snapshot Info
        strategic_count = len(grouped.get("Strategic", []))
        important_count = len(grouped.get("Important", []))
        insights_count = len(grouped.get("Insights", []))

        # Categories
        categories = [art.category for art in report.articles if art.category]
        top_topics = [item[0] for item in Counter(categories).most_common(4)]

        # Sum reading times
        total_reading_time = 0
        for art in report.articles:
            if art.reading_time:
                match = re.search(r'\d+', art.reading_time)
                if match:
                    total_reading_time += int(match.group())
        if total_reading_time == 0:
            total_reading_time = len(report.articles) * 2

        context = {
            "date_str": report.report_date.strftime("%B %d, %Y"),
            "grouped_articles": dict(grouped),
            "all_articles": report.articles,
            "takeaways": report,
            "greeting_name": first_name,
            "greeting_time": greeting_time,
            "greeting_date": greeting_date,
            "strategic_count": strategic_count,
            "important_count": important_count,
            "insights_count": insights_count,
            "top_topics": top_topics,
            "total_reading_time": total_reading_time
        }

        html_content = html_template.render(context)
        txt_content = txt_template.render(context)

        return html_content, txt_content

    def _render_templates_for_user(self, report: DailyReport, recipient_email: str, recipient_name: str = None) -> tuple[str, str]:
        """Renders both the plaintext and HTML templates for a specific recipient."""
        html_template = self.jinja_env.get_template("briefing.html")
        txt_template = self.jinja_env.get_template("briefing.txt")

        # Group articles by priority
        grouped = defaultdict(list)
        for article in report.articles:
            priority = article.priority or "Insights"
            if priority == "Informational":
                priority = "Insights"
            grouped[priority].append(article)

        # Compute Greeting Info
        first_name = recipient_name or extract_first_name(recipient_email)
        
        import zoneinfo
        try:
            tz = zoneinfo.ZoneInfo(config.TIMEZONE)
            local_now = datetime.now(tz)
        except Exception:
            local_now = datetime.now()
            
        current_hour = local_now.hour
        if current_hour < 12:
            greeting_time = "Good Morning"
        elif current_hour < 17:
            greeting_time = "Good Afternoon"
        else:
            greeting_time = "Good Evening"
        
        greeting_date = local_now.strftime("%d-%m-%Y")

        # Compute Snapshot Info
        strategic_count = len(grouped.get("Strategic", []))
        important_count = len(grouped.get("Important", []))
        insights_count = len(grouped.get("Insights", []))

        # Categories
        categories = [art.category for art in report.articles if art.category]
        top_topics = [item[0] for item in Counter(categories).most_common(4)]

        # Sum reading times
        total_reading_time = 0
        for art in report.articles:
            if art.reading_time:
                match = re.search(r'\d+', art.reading_time)
                if match:
                    total_reading_time += int(match.group())
        if total_reading_time == 0:
            total_reading_time = len(report.articles) * 2

        context = {
            "date_str": report.report_date.strftime("%B %d, %Y"),
            "grouped_articles": dict(grouped),
            "all_articles": report.articles,
            "takeaways": report,
            "greeting_name": first_name,
            "greeting_time": greeting_time,
            "greeting_date": greeting_date,
            "strategic_count": strategic_count,
            "important_count": important_count,
            "insights_count": insights_count,
            "top_topics": top_topics,
            "total_reading_time": total_reading_time
        }

        html_content = html_template.render(context)
        txt_content = txt_template.render(context)

        return html_content, txt_content

    def send_briefing(self, report: DailyReport, custom_subscribers: list[dict] = None) -> bool:
        """Constructs and sends the daily brief email, customized per recipient based on topic preferences."""
        is_configured = (
            self.smtp_username and 
            self.smtp_password and 
            self.smtp_username != "your_email@gmail.com" and
            self.smtp_password != "your_app_password"
        )
        if not is_configured:
            logger.warning("SMTP credentials are not configured or are using template placeholder defaults. Skipping email delivery.")
            return False

        try:
            repo = get_repository()
        except Exception as e:
            logger.error(f"Failed to fetch repository for preferences checking: {e}")
            repo = None

        # Load active subscribers from Supabase/PostgreSQL database if not provided
        db_subscribers = []
        if custom_subscribers is not None:
            db_subscribers = custom_subscribers
            logger.info(f"Using {len(db_subscribers)} custom newsletter subscribers provided for delivery.")
        elif repo:
            try:
                db_subscribers = repo.get_active_subscribers()
                logger.info(f"Loaded {len(db_subscribers)} active newsletter subscribers from database.")
            except Exception as e:
                logger.error(f"Failed to query active subscribers from repository: {e}")
                
        # Load hardcoded whitelist from environment variable/secret
        secret_recipients = [e.strip() for e in self.email_to.split(",") if e.strip()]
        
        # Build comprehensive unified recipients mapping: email_address -> recipient_info
        recipients_map = {}

        # 1. Add active subscribers from DB
        for sub in db_subscribers:
            email_key = sub["email"].strip().lower()
            recipients_map[email_key] = {
                "email": sub["email"].strip(),
                "name": sub["first_name"],
                "subscribed_topics": sub["preferred_topics"],
                "newsletter_enabled": sub["newsletter_enabled"]
            }

        # 2. Add secret whitelisted overrides (if not already added)
        for email in secret_recipients:
            email_key = email.strip().lower()
            if email_key not in recipients_map:
                profile = None
                if repo:
                    try:
                        profile = repo.get_profile_by_email(email)
                    except Exception as e:
                        pass
                
                if profile:
                    recipients_map[email_key] = {
                        "email": email.strip(),
                        "name": profile.get("first_name", "Reader"),
                        "subscribed_topics": profile.get("preferred_topics", []),
                        "newsletter_enabled": profile.get("newsletter_enabled", False)
                    }
                else:
                    # Pure fallback guest recipient
                    recipients_map[email_key] = {
                        "email": email.strip(),
                        "name": extract_first_name(email),
                        "subscribed_topics": repo.get_user_preferences(email) if repo else [],
                        "newsletter_enabled": True
                    }

        if not recipients_map:
            logger.warning("No email recipients found in database or secrets.")
            return False

        try:
            logger.info(f"Connecting to SMTP server at {self.smtp_host}:{self.smtp_port}...")
            
            if self.smtp_port == 465:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=15)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15)
                server.ehlo()
                server.starttls()
                server.ehlo()

            with server:
                logger.info(f"Logging in as {self.smtp_username}...")
                server.login(self.smtp_username, self.smtp_password)
                
                # Send email separately to each recipient to allow personalized topic filters
                for email_key, sub_info in recipients_map.items():
                    recipient = sub_info["email"]
                    recipient_name = sub_info["name"]
                    subscribed = sub_info["subscribed_topics"]
                    newsletter_enabled = sub_info["newsletter_enabled"]

                    if not newsletter_enabled:
                        logger.info(f"Recipient {recipient} has disabled email briefings in their profile. Skipping.")
                        continue
                    
                    # Filter report copy for this user if they configured custom topics
                    if subscribed:
                        filtered_articles = []
                        for art in report.articles:
                            if not art.category:
                                filtered_articles.append(art)
                                continue
                            
                            # Case-insensitive match against whitelisted topics
                            match = any(
                                sub.lower() in art.category.lower() or art.category.lower() in sub.lower()
                                for sub in subscribed
                            )
                            if match:
                                filtered_articles.append(art)
                        
                        from dataclasses import replace
                        user_report = replace(report, articles=filtered_articles)
                    else:
                        user_report = report

                    if not user_report.articles:
                        logger.info(f"Recipient {recipient} has no matching articles for their subscriptions. Skipping email.")
                        continue

                    html_content, txt_content = self._render_templates_for_user(user_report, recipient, recipient_name)

                    # Create MIME container
                    msg = MIMEMultipart("alternative")
                    date_str = report.report_date.strftime("%B %d, %Y")
                    msg["Subject"] = f"OpsiAI - Today's Latest AI Updates - {date_str}"
                    msg["From"] = f"OpsiAI <{self.email_from}>"
                    msg["To"] = recipient

                    # Attach parts
                    msg.attach(MIMEText(txt_content, "plain"))
                    msg.attach(MIMEText(html_content, "html"))

                    logger.info(f"Delivering customized brief to {recipient}...")
                    server.sendmail(self.email_from, [recipient], msg.as_string())
                
            logger.info("Email briefings delivered successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to send email briefing: {e}", exc_info=True)
            return False
