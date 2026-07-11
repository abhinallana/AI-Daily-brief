import os
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Dict, List
from jinja2 import Environment, FileSystemLoader
from app.config.config import config
from app.models.article import Article

logger = logging.getLogger(__name__)

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

    def _render_templates(self, date_str: str, grouped_articles: Dict[str, List[Article]]) -> tuple[str, str]:
        """Renders both the plaintext and HTML templates."""
        html_template = self.jinja_env.get_template("briefing.html")
        txt_template = self.jinja_env.get_template("briefing.txt")

        context = {
            "date_str": date_str,
            "grouped_articles": grouped_articles
        }

        html_content = html_template.render(context)
        txt_content = txt_template.render(context)

        return html_content, txt_content

    def send_briefing(self, date_str: str, grouped_articles: Dict[str, List[Article]]) -> bool:
        """Constructs and sends the daily brief email."""
        # Ensure credentials are set and are not placeholder defaults
        is_configured = (
            self.smtp_username and 
            self.smtp_password and 
            self.smtp_username != "your_email@gmail.com" and
            self.smtp_password != "your_app_password"
        )
        if not is_configured:
            logger.warning("SMTP credentials are not configured or are using template placeholder defaults. Skipping email delivery.")
            return False

        html_content, txt_content = self._render_templates(date_str, grouped_articles)


        # Create MIME container
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"AI & DevOps Daily Brief - {date_str}"
        msg["From"] = self.email_from
        msg["To"] = self.email_to

        # Attach text and html parts
        # The last attached part is preferred by email clients (HTML is attached second)
        msg.attach(MIMEText(txt_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        try:
            logger.info(f"Connecting to SMTP server at {self.smtp_host}:{self.smtp_port}...")
            
            # Choose correct connection method based on port
            if self.smtp_port == 465:
                # SSL Port
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=15)
            else:
                # TLS Port (usually 587)
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15)
                server.ehlo()
                server.starttls() # Secure the connection
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
