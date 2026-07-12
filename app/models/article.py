from dataclasses import dataclass
from typing import Optional

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


