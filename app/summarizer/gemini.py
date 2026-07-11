import logging
import dataclasses
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from app.config.config import config
from app.models.article import Article

logger = logging.getLogger(__name__)

class ArticleAnalysis(BaseModel):
    is_relevant: bool = Field(
        description="Flag indicating if the article is relevant to the whitelisted topics."
    )
    category: str = Field(
        description="The exact topic from the whitelisted topics list that fits best. Must be empty if is_relevant is false."
    )
    ai_summary: str = Field(
        description="A clear, professional, 1-2 sentence summary of the main points in the article. Must be empty if is_relevant is false."
    )
    priority: str = Field(
        description="Priority rating for the article based on tech impact. Must be exactly 'Strategic', 'Important', or 'Informational'. Must be empty if is_relevant is false."
    )

class GeminiSummarizer:
    def __init__(self) -> None:
        self.api_key = config.GEMINI_API_KEY
        # If the API key is not set, is empty, or is the default placeholder value, skip init.
        if not self.api_key or self.api_key in ("", "your_gemini_api_key"):
            logger.warning("GEMINI_API_KEY is not set or is the template placeholder. Summarization will fallback to skip.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def analyze_article(self, article: Article) -> Article:
        """Analyzes an article using Gemini: determines relevance, category, and summary."""
        if not self.client:
            logger.warning(f"Gemini client not initialized. Skipping analysis for: {article.title}")
            # Fallback default priority for unanalyzed entries
            return dataclasses.replace(article, priority="Informational")

        topics_list = ", ".join(config.TOPICS)
        
        prompt = f"""
        You are a Senior Software Architect and Tech Editor. Analyze the following tech news article:
        
        Title: {article.title}
        Raw Summary: {article.summary or 'No description provided.'}
        Source: {article.source or 'Unknown'}
        
        Whitelisted Topics: {topics_list}
        
        Instructions:
        1. Determine if the article is relevant to any of the Whitelisted Topics. If it is about general news, lifestyle, politics, or other tech topics not listed, set is_relevant to false.
        2. If relevant, select the single most accurate category from the Whitelisted Topics list. It MUST match one of the items exactly.
        3. If relevant, generate a professional, concise 1-2 sentence executive summary.
        4. If relevant, rate the importance of this news as either 'Strategic', 'Important', or 'Informational':
           - 'Strategic': Critical architectural shifts, major framework/language releases, core security patches, or breakthrough AI model announcements.
           - 'Important': Weekly roundups, standard service updates, plugin announcements, or standard releases.
           - 'Informational': Minor patches, documentation updates, or small incremental improvements.
        """

        try:
            logger.info(f"Analyzing article: {article.title}")
            response = self.client.models.generate_content(
                model=config.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ArticleAnalysis,
                    temperature=0.1,
                ),
            )
            
            # Parse structured JSON output
            result = ArticleAnalysis.model_validate_json(response.text)
            
            matched_category = None
            matched_priority = "Informational"
            if result.is_relevant:
                category_val = result.category.strip()
                for topic in config.TOPICS:
                    if topic.lower() == category_val.lower():
                        matched_category = topic
                        break
                if not matched_category:
                    logger.debug(f"AI returned category '{category_val}' which is not in whitelist. Defaulting to first whitelist item.")
                    matched_category = config.TOPICS[0]
                
                priority_val = result.priority.strip()
                if priority_val in ("Strategic", "Important", "Informational"):
                    matched_priority = priority_val

            updated_article = dataclasses.replace(
                article,
                is_relevant=result.is_relevant,
                category=matched_category if result.is_relevant else None,
                ai_summary=result.ai_summary if result.is_relevant else None,
                priority=matched_priority if result.is_relevant else "Informational"
            )
            return updated_article
            
        except Exception as e:
            logger.error(f"Error during Gemini analysis for article '{article.title}': {e}", exc_info=True)
            return dataclasses.replace(article, priority="Informational")


