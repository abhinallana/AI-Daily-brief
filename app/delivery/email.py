import os
import logging
import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Dict, List
from collections import Counter, defaultdict
from jinja2 import Environment, FileSystemLoader
from app.config.config import config
from app.domain.entities import DailyReport

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
        first_name = extract_first_name(self.email_to)
        
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

    def send_briefing(self, report: DailyReport) -> bool:
        """Constructs and sends the daily brief email."""
        is_configured = (
            self.smtp_username and 
            self.smtp_password and 
            self.smtp_username != "your_email@gmail.com" and
            self.smtp_password != "your_app_password"
        )
        if not is_configured:
            logger.warning("SMTP credentials are not configured or are using template placeholder defaults. Skipping email delivery.")
            return False

        html_content, txt_content = self._render_templates(report)

        # Create MIME container
        msg = MIMEMultipart("alternative")
        date_str = report.report_date.strftime("%B %d, %Y")
        msg["Subject"] = f"OpsiAI - Today's Latest AI Updates - {date_str}"
        msg["From"] = self.email_from
        msg["To"] = self.email_to

        # Attach text and html parts
        msg.attach(MIMEText(txt_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

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
                
                logger.info(f"Sending daily brief email from {self.email_from} to {self.email_to}...")
                server.sendmail(self.email_from, self.email_to, msg.as_string())
                
            logger.info("Daily Brief email sent successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to send email briefing: {e}", exc_info=True)
            return False
