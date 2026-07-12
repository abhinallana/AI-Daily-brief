import os
from dotenv import load_dotenv

# Load environment variables from a local .env file
load_dotenv()

class Config:
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "daily_brief.db")
    
    # Gemini API settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")
    
    # SMTP Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "")
    EMAIL_TO: str = os.getenv("EMAIL_TO", "")
    
    # Whitelisted topics to filter and categorize articles

    TOPICS: list[str] = [
        "Artificial Intelligence", "OpenAI", "Anthropic", "Google AI / Gemini", 
        "Microsoft AI", "Meta AI", "Hugging Face", "NVIDIA AI", "Kubernetes", 
        "Docker", "DevOps", "AWS", "Azure", "Terraform", "GitHub Actions", 
        "ArgoCD", "Helm", "Platform Engineering", "AI Agents", "MCP", 
        "LangGraph", "CrewAI", "LLMs", "Open Source AI", "Python", "Cloud Engineering"
    ]
    
    # Comma-separated list of feeds from environment variables
    _RSS_FEEDS_RAW: str = os.getenv(
        "RSS_FEEDS", 
        "https://kubernetes.io/feed.xml,https://aws.amazon.com/blogs/aws/feed/,https://www.cncf.io/blog/feed/,https://github.blog/feed/,https://openai.com/blog/rss.xml"
    )
    
    @property
    def RSS_FEEDS(self) -> list[str]:
        """Parses the raw RSS feed string into a list of URLs."""
        return [feed.strip() for feed in self._RSS_FEEDS_RAW.split(",") if feed.strip()]

config = Config()



