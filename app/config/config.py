import os
from dotenv import load_dotenv

# Load environment variables from a local .env file
load_dotenv()

class Config:
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "daily_brief.db")
    DB_TYPE: str = os.getenv("DB_TYPE", "sqlite").lower()
    DB_HOST: str = os.getenv("DB_HOST", "")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "")
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    
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
        "LangGraph", "CrewAI", "LLMs", "Open Source AI", "Python", "Cloud Engineering",
        "Mistral AI", "xAI", "Cohere", "DeepSeek", "Perplexity AI", "Stability AI",
        "Together AI", "Fireworks AI", "LangChain", "LlamaIndex", "AutoGen", "DSPy",
        "Haystack", "OpenRouter", "Ollama", "Oracle Cloud", "Cloudflare", "DigitalOcean",
        "Netlify", "CNCF"
    ]
    
    # Comma-separated list of feeds from environment variables
    _RSS_FEEDS_RAW: str = os.getenv(
        "RSS_FEEDS", 
        "https://kubernetes.io/feed.xml,https://aws.amazon.com/blogs/aws/feed/,https://www.cncf.io/blog/feed/,https://github.blog/feed/,https://openai.com/blog/rss.xml,https://www.anthropic.com/index.xml,https://research.google/blog/rss/,https://ai.meta.com/blog/rss/,https://huggingface.co/blog/feed.xml,https://blogs.nvidia.com/feed/,https://blog.langchain.dev/rss/,https://blog.llamaindex.ai/feed,https://cloud.google.com/blog/rss/,https://www.hashicorp.com/blog/feed.xml,https://azure.microsoft.com/en-us/blog/feed/,https://feed.infoq.com/devops/news,https://www.crewai.com/blog/rss,https://openrouter.ai/blog/rss.xml,https://github.com/ollama/ollama/releases.atom,https://blogs.oracle.com/cloud-infrastructure/rss,https://blog.cloudflare.com/rss,https://www.digitalocean.com/blog/rss,https://www.netlify.com/blog/rss.xml"
    )
    
    @property
    def RSS_FEEDS(self) -> list[str]:
        """Parses the raw RSS feed string into a list of URLs."""
        return [feed.strip() for feed in self._RSS_FEEDS_RAW.split(",") if feed.strip()]

config = Config()



