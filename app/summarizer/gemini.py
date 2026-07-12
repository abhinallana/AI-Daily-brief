import logging
import time
import dataclasses
from typing import List, Dict
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from app.config.config import config
from app.models.article import Article

logger = logging.getLogger(__name__)

class ArticleAnalysis(BaseModel):
    id: int = Field(description="The index of the article in the input list (0-indexed).")
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
    why_it_matters: str = Field(
        description="A concise explanation of why this article/news matters to developers or AI engineers. Must be empty if is_relevant is false."
    )

class BatchArticleAnalysis(BaseModel):
    results: List[ArticleAnalysis] = Field(description="List of analysis results matching the input articles list.")

class TakeawayAnalysis(BaseModel):
    biggest_announcement: str = Field(description="The single most important technical or product announcement from today's brief.")
    biggest_trend: str = Field(description="The primary trend or direction observed across these updates.")
    one_thing_to_know: str = Field(description="One critical thing every AI engineer or developer should know from today's brief.")
    reading_time_saved_minutes: int = Field(description="Estimated reading time saved in minutes for the reader (e.g. 18).")

class GeminiSummarizer:
    def __init__(self) -> None:
        self.api_key = config.GEMINI_API_KEY
        # If the API key is not set, is empty, or is the default placeholder value, skip init.
        if not self.api_key or self.api_key in ("", "your_gemini_api_key"):
            logger.warning("GEMINI_API_KEY is not set or is the template placeholder. Summarization will fallback to skip.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def analyze_articles(self, articles: List[Article]) -> List[Article]:
        """Analyzes a list of articles in batches using Gemini to check relevance, categories, and priority."""
        if not articles:
            return []
            
        if not self.client:
            logger.warning("Gemini client not initialized. Skipping batch analysis.")
            # Set default fallback priority for all
            return [dataclasses.replace(art, priority="Informational") for art in articles]
            
        # Define batch size (10 articles per batch to ensure high-quality JSON schemas)
        batch_size = 10
        analyzed_articles = []
        
        for i in range(0, len(articles), batch_size):
            batch = articles[i:i+batch_size]
            logger.info(f"Processing Gemini batch {i // batch_size + 1} ({len(batch)} articles)...")
            
            try:
                analyzed_batch = self._analyze_batch(batch)
                analyzed_articles.extend(analyzed_batch)
            except Exception as e:
                logger.error(f"Error processing batch {i // batch_size + 1}: {e}", exc_info=True)
                # Fallback: process individual articles in this batch if batch fails
                logger.info("Retrying batch articles individually...")
                for art in batch:
                    analyzed_articles.append(self._analyze_single_fallback(art))
                    
        return analyzed_articles

    def _analyze_batch(self, articles: List[Article]) -> List[Article]:
        topics_list = ", ".join(config.TOPICS)
        
        prompt = f"""
        You are a Senior Software Architect and Tech Editor. Analyze the following list of tech news articles:
        
        Whitelisted Topics: {topics_list}
        
        Instructions:
        For each article in the input list:
        1. Determine if the article is relevant to any of the Whitelisted Topics. If it is about general news, lifestyle, politics, or other tech topics not listed, set is_relevant to false.
        2. If relevant, select the single most accurate category from the Whitelisted Topics list. It MUST match one of the items exactly.
        3. If relevant, generate a professional, concise 1-2 sentence executive summary (ai_summary).
        4. If relevant, rate the importance of this news as either 'Strategic', 'Important', or 'Informational' (priority):
           - 'Strategic': Critical architectural shifts, major framework/language releases, core security patches, or breakthrough AI model announcements.
           - 'Important': Weekly roundups, standard service updates, plugin announcements, or standard releases.
           - 'Informational': Minor patches, documentation updates, or small incremental improvements.
        5. If relevant, generate a concise explanation of why this news/article matters to developers or AI engineers (why_it_matters).
        
        Input Articles List:
        """
        for idx, article in enumerate(articles):
            prompt += f"\n--- Article Index {idx} ---\n"
            prompt += f"Title: {article.title}\n"
            prompt += f"Raw Summary: {article.summary or 'No description provided.'}\n"
            prompt += f"Source: {article.source or 'Unknown'}\n"

        response = self.client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=BatchArticleAnalysis,
                temperature=0.1,
            ),
        )
        
        # Parse structured batch response
        batch_result = BatchArticleAnalysis.model_validate_json(response.text)
        
        # Map results back to articles
        analyzed_batch = []
        result_map = {res.id: res for res in batch_result.results}
        
        for idx, article in enumerate(articles):
            result = result_map.get(idx)
            if result and result.is_relevant:
                matched_category = None
                category_val = result.category.strip()
                for topic in config.TOPICS:
                    if topic.lower() == category_val.lower():
                        matched_category = topic
                        break
                if not matched_category:
                    matched_category = config.TOPICS[0]
                    
                matched_priority = "Informational"
                if result.priority in ("Strategic", "Important", "Informational"):
                    matched_priority = result.priority
                    
                analyzed_batch.append(dataclasses.replace(
                    article,
                    is_relevant=True,
                    category=matched_category,
                    ai_summary=result.ai_summary,
                    priority=matched_priority,
                    why_it_matters=result.why_it_matters
                ))
            else:
                # Not relevant or missing result
                analyzed_batch.append(dataclasses.replace(
                    article,
                    is_relevant=False,
                    category=None,
                    ai_summary=None,
                    priority="Informational"
                ))
                
        return analyzed_batch

    def _analyze_single_fallback(self, article: Article) -> Article:
        """Fallback method to analyze a single article if batch processing fails."""
        topics_list = ", ".join(config.TOPICS)
        
        prompt = f"""
        You are a Tech Editor. Analyze the following article:
        
        Title: {article.title}
        Raw Summary: {article.summary or 'No description provided.'}
        Source: {article.source or 'Unknown'}
        
        Whitelisted Topics: {topics_list}
        
        Instructions:
        1. Determine if the article is relevant to the Whitelisted Topics (set is_relevant).
        2. If relevant, select category from the whitelist.
        3. If relevant, write a 1-2 sentence summary (ai_summary).
        4. If relevant, rate priority as 'Strategic', 'Important', or 'Informational' (priority).
        5. If relevant, generate a concise explanation of why this news/article matters to developers or AI engineers (why_it_matters).
        """
        try:
            # We reuse the single analysis schema by passing a list structure of 1 item
            class SingleArticleAnalysis(BaseModel):
                is_relevant: bool
                category: str
                ai_summary: str
                priority: str
                why_it_matters: str

            response = self.client.models.generate_content(
                model=config.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SingleArticleAnalysis,
                    temperature=0.1,
                ),
            )
            result = SingleArticleAnalysis.model_validate_json(response.text)
            
            if result.is_relevant:
                matched_category = None
                category_val = result.category.strip()
                for topic in config.TOPICS:
                    if topic.lower() == category_val.lower():
                        matched_category = topic
                        break
                if not matched_category:
                    matched_category = config.TOPICS[0]
                    
                matched_priority = "Informational"
                if result.priority in ("Strategic", "Important", "Informational"):
                    matched_priority = result.priority

                return dataclasses.replace(
                    article,
                    is_relevant=True,
                    category=matched_category,
                    ai_summary=result.ai_summary,
                    priority=matched_priority,
                    why_it_matters=result.why_it_matters
                )
            else:
                return dataclasses.replace(article, is_relevant=False, priority="Informational")
        except Exception as e:
            logger.error(f"Fallback single analysis failed for '{article.title}': {e}")
            return dataclasses.replace(article, priority="Informational")

    def generate_takeaways(self, articles: List[Article]) -> TakeawayAnalysis:
        """Generates Today's Takeaway summary from the list of briefing articles."""
        if not articles or not self.client:
            return TakeawayAnalysis(
                biggest_announcement="No major announcements today.",
                biggest_trend="No major trends observed.",
                one_thing_to_know="Stay tuned for tomorrow's updates.",
                reading_time_saved_minutes=0
            )
            
        prompt = """
        You are a Senior Tech Editor and Software Architect. Analyze the following list of summarized tech news articles and synthesize 'Today's Takeaway'.
        
        Provide:
        1. biggest_announcement: A single sentence describing the most significant announcement from these articles.
        2. biggest_trend: A single sentence describing the key trend observed across these articles.
        3. one_thing_to_know: A single key actionable takeaway or crucial detail that every AI engineer must know.
        4. reading_time_saved_minutes: Estimate how many minutes an engineer saved by reading this briefing instead of all full articles. (A reasonable estimate, e.g. between 10 to 30 minutes, based on the quantity and depth of articles).
        
        Articles List:
        """
        for idx, art in enumerate(articles):
            prompt += f"\n- {art.title} (Source: {art.source})\n  Summary: {art.ai_summary or art.summary or 'N/A'}\n"
            
        try:
            response = self.client.models.generate_content(
                model=config.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=TakeawayAnalysis,
                    temperature=0.2,
                ),
            )
            return TakeawayAnalysis.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Error generating takeaways: {e}", exc_info=True)
            return TakeawayAnalysis(
                biggest_announcement="Unable to generate summary at this time.",
                biggest_trend="Unable to generate trend at this time.",
                one_thing_to_know="Check the individual article details.",
                reading_time_saved_minutes=0
            )
