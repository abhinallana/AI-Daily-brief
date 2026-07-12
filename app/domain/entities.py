import hashlib
from dataclasses import dataclass
from datetime import date
from typing import Optional, List

@dataclass(frozen=True)
class Article:
    title: str
    link: str
    published_at: str
    summary: Optional[str] = None
    source: Optional[str] = None
    ai_summary: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    why_it_matters: Optional[str] = None
    is_relevant: bool = True
    reading_time: Optional[str] = None
    link_hash: Optional[str] = None

    def __post_init__(self):
        if not self.link_hash and self.link:
            object.__setattr__(self, 'link_hash', hashlib.sha256(self.link.encode('utf-8')).hexdigest())

    @property
    def icon(self) -> str:
        name = (self.source or "").lower() + " " + (self.category or "").lower() + " " + (self.title or "").lower()
        if "openai" in name:
            return "🤖"
        if "aws" in name or "amazon" in name:
            return "☁️"
        if "kubernetes" in name or "k8s" in name:
            return "⚓"
        if "github" in name:
            return "🐙"
        if "anthropic" in name or "claude" in name:
            return "🧠"
        if "meta" in name:
            return "📘"
        if "google" in name or "gemini" in name:
            return "✨"
        if "microsoft" in name:
            return "💻"
        if "hugging face" in name or "huggingface" in name:
            return "🤗"
        if "nvidia" in name:
            return "🟢"
        if "docker" in name:
            return "🐳"
        if "devops" in name:
            return "⚙️"
        if "azure" in name:
            return "🔷"
        if "terraform" in name:
            return "🛠️"
        if "argocd" in name:
            return "⛵"
        if "helm" in name:
            return "☸️"
        if "platform engineering" in name:
            return "🏗️"
        if "ai agents" in name or "agent" in name:
            return "🤖"
        if "mcp" in name:
            return "🔌"
        if "langgraph" in name:
            return "🕸️"
        if "crewai" in name:
            return "👥"
        if "python" in name:
            return "🐍"
        if "llm" in name:
            return "💬"
        if "open source ai" in name:
            return "📖"
        if "cloud" in name:
            return "☁️"
        return "📰"

@dataclass(frozen=True)
class TakeawayAnalysis:
    biggest_announcement: str
    biggest_trend: str
    one_thing_to_know: str
    reading_time_saved_minutes: int

@dataclass(frozen=True)
class DailyReport:
    report_date: date
    biggest_announcement: str
    biggest_trend: str
    one_thing_to_know: str
    reading_time_saved_minutes: int
    articles: List[Article]
