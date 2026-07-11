import sqlite3
import logging
from typing import List
from app.models.article import Article

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Returns an sqlite3 connection with Row factory configured."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initializes the database schema if it does not exist and applies migrations."""
        logger.info(f"Initializing database at: {self.db_path}")
        schema = """
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            link TEXT UNIQUE NOT NULL,
            published_at TEXT,
            summary TEXT,
            source TEXT,
            ai_summary TEXT,
            category TEXT,
            is_relevant INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        try:
            with self._get_connection() as conn:
                conn.execute(schema)
                
                # Check for existing column info to apply schema migrations if database exists
                cursor = conn.execute("PRAGMA table_info(articles)")
                columns = [row["name"] for row in cursor.fetchall()]
                
                if "ai_summary" not in columns:
                    logger.info("Migrating database: adding 'ai_summary' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN ai_summary TEXT")
                if "category" not in columns:
                    logger.info("Migrating database: adding 'category' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN category TEXT")
                if "is_relevant" not in columns:
                    logger.info("Migrating database: adding 'is_relevant' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN is_relevant INTEGER DEFAULT 1")
                
                conn.commit()
            logger.debug("Database schema checked/initialized successfully.")
        except sqlite3.Error as e:
            logger.critical(f"Failed to initialize database: {e}", exc_info=True)
            raise

    def save_articles(self, articles: List[Article]) -> int:
        """Saves a list of articles to the database, ignoring duplicates.
        
        Returns the number of new articles inserted.
        """
        query = """
        INSERT OR IGNORE INTO articles (title, link, published_at, summary, source, ai_summary, category, is_relevant)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        inserted_count = 0
        try:
            with self._get_connection() as conn:
                # Prepare arguments
                data = [
                    (
                        art.title, 
                        art.link, 
                        art.published_at, 
                        art.summary, 
                        art.source,
                        art.ai_summary,
                        art.category,
                        1 if art.is_relevant else 0
                    )
                    for art in articles
                ]
                cursor = conn.executemany(query, data)
                inserted_count = cursor.rowcount
                conn.commit()
            logger.info(f"Saved {inserted_count} new articles to the database.")
            return inserted_count
        except sqlite3.Error as e:
            logger.error(f"Error saving articles to database: {e}", exc_info=True)
            return 0

    def is_duplicate(self, link: str) -> bool:
        """Checks if a given article link already exists in the database."""
        query = "SELECT 1 FROM articles WHERE link = ? LIMIT 1"
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(query, (link,))
                return cursor.fetchone() is not None
        except sqlite3.Error as e:
            logger.error(f"Error checking duplicate link {link}: {e}", exc_info=True)
            return False

    def get_recent_articles(self, limit: int = 50, only_relevant: bool = True) -> List[Article]:
        """Fetches the most recently inserted articles from the database."""
        if only_relevant:
            query = """
            SELECT title, link, published_at, summary, source, ai_summary, category, is_relevant
            FROM articles
            WHERE is_relevant = 1
            ORDER BY id DESC
            LIMIT ?
            """
        else:
            query = """
            SELECT title, link, published_at, summary, source, ai_summary, category, is_relevant
            FROM articles
            ORDER BY id DESC
            LIMIT ?
            """
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(query, (limit,))
                rows = cursor.fetchall()
                return [
                    Article(
                        title=row["title"],
                        link=row["link"],
                        published_at=row["published_at"],
                        summary=row["summary"],
                        source=row["source"],
                        ai_summary=row["ai_summary"],
                        category=row["category"],
                        is_relevant=bool(row["is_relevant"])
                    )
                    for row in rows
                ]
        except sqlite3.Error as e:
            logger.error(f"Error retrieving recent articles: {e}", exc_info=True)
            return []

