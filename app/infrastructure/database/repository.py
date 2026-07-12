import sqlite3
import logging
import hashlib
from datetime import date, datetime
from typing import List, Optional
from app.domain.entities import Article, DailyReport

logger = logging.getLogger(__name__)

class SQLiteArticleRepository:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initializes the database schema and performs necessary migrations."""
        logger.info(f"Initializing database at: {self.db_path}")
        schema = """
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            link_hash TEXT UNIQUE,
            title TEXT NOT NULL,
            link TEXT UNIQUE NOT NULL,
            published_at TEXT,
            summary TEXT,
            source TEXT,
            ai_summary TEXT,
            category TEXT,
            priority TEXT,
            why_it_matters TEXT,
            reading_time TEXT,
            is_relevant INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        reports_schema = """
        CREATE TABLE IF NOT EXISTS daily_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_date TEXT UNIQUE,
            biggest_announcement TEXT,
            biggest_trend TEXT,
            one_thing_to_know TEXT,
            reading_time_saved_minutes INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        links_schema = """
        CREATE TABLE IF NOT EXISTS report_articles (
            report_id INTEGER,
            article_id INTEGER,
            PRIMARY KEY (report_id, article_id),
            FOREIGN KEY (report_id) REFERENCES daily_reports(id) ON DELETE CASCADE,
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        );
        """
        try:
            with self._get_connection() as conn:
                conn.execute(schema)
                conn.execute(reports_schema)
                conn.execute(links_schema)
                
                # Apply column migrations dynamically if the table info is missing columns
                cursor = conn.execute("PRAGMA table_info(articles)")
                columns = [row["name"] for row in cursor.fetchall()]
                
                if "ai_summary" not in columns:
                    logger.info("Migrating database: adding 'ai_summary' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN ai_summary TEXT")
                if "category" not in columns:
                    logger.info("Migrating database: adding 'category' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN category TEXT")
                if "priority" not in columns:
                    logger.info("Migrating database: adding 'priority' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN priority TEXT")
                if "why_it_matters" not in columns:
                    logger.info("Migrating database: adding 'why_it_matters' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN why_it_matters TEXT")
                if "reading_time" not in columns:
                    logger.info("Migrating database: adding 'reading_time' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN reading_time TEXT")
                if "link_hash" not in columns:
                    logger.info("Migrating database: adding 'link_hash' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN link_hash TEXT")
                    # Backfill link_hash for older rows
                    cursor = conn.execute("SELECT id, link FROM articles")
                    rows = cursor.fetchall()
                    for r in rows:
                        l_hash = hashlib.sha256(r["link"].encode('utf-8')).hexdigest()
                        conn.execute("UPDATE articles SET link_hash = ? WHERE id = ?", (l_hash, r["id"]))
                    # Create index
                    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_link_hash ON articles(link_hash)")
                if "is_relevant" not in columns:
                    logger.info("Migrating database: adding 'is_relevant' column.")
                    conn.execute("ALTER TABLE articles ADD COLUMN is_relevant INTEGER DEFAULT 1")
                
                conn.commit()
            logger.debug("Database schema checked/initialized successfully.")
        except sqlite3.Error as e:
            logger.critical(f"Failed to initialize database: {e}", exc_info=True)
            raise

    def save_articles(self, articles: List[Article]) -> int:
        """Saves a list of articles to the database, ignoring duplicates."""
        query = """
        INSERT OR IGNORE INTO articles (link_hash, title, link, published_at, summary, source, ai_summary, category, priority, why_it_matters, reading_time, is_relevant)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        inserted_count = 0
        try:
            with self._get_connection() as conn:
                data = [
                    (
                        art.link_hash,
                        art.title, 
                        art.link, 
                        art.published_at, 
                        art.summary, 
                        art.source,
                        art.ai_summary,
                        art.category,
                        art.priority,
                        art.why_it_matters,
                        art.reading_time,
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
        link_hash = hashlib.sha256(link.encode('utf-8')).hexdigest()
        query = "SELECT 1 FROM articles WHERE link_hash = ? OR link = ? LIMIT 1"
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(query, (link_hash, link))
                return cursor.fetchone() is not None
        except sqlite3.Error as e:
            logger.error(f"Error checking duplicate link {link}: {e}", exc_info=True)
            return False

    def get_recent_articles(self, limit: int = 50, only_relevant: bool = True) -> List[Article]:
        """Fetches the most recently inserted articles from the database."""
        if only_relevant:
            query = """
            SELECT link_hash, title, link, published_at, summary, source, ai_summary, category, priority, why_it_matters, reading_time, is_relevant
            FROM articles
            WHERE is_relevant = 1
            ORDER BY id DESC
            LIMIT ?
            """
        else:
            query = """
            SELECT link_hash, title, link, published_at, summary, source, ai_summary, category, priority, why_it_matters, reading_time, is_relevant
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
                        priority=row["priority"],
                        why_it_matters=row["why_it_matters"],
                        is_relevant=bool(row["is_relevant"]),
                        reading_time=row["reading_time"],
                        link_hash=row["link_hash"]
                    )
                    for row in rows
                ]
        except sqlite3.Error as e:
            logger.error(f"Error retrieving recent articles: {e}", exc_info=True)
            return []

    def save_daily_report(self, report: DailyReport) -> None:
        """Saves a pre-computed DailyReport and its associated articles to the database."""
        date_str = report.report_date.isoformat()
        
        try:
            with self._get_connection() as conn:
                # 1. Insert or replace report details
                conn.execute(
                    """
                    INSERT OR REPLACE INTO daily_reports 
                    (report_date, biggest_announcement, biggest_trend, one_thing_to_know, reading_time_saved_minutes)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        date_str,
                        report.biggest_announcement,
                        report.biggest_trend,
                        report.one_thing_to_know,
                        report.reading_time_saved_minutes
                    )
                )
                
                # Fetch report ID
                cursor = conn.execute("SELECT id FROM daily_reports WHERE report_date = ?", (date_str,))
                report_id = cursor.fetchone()["id"]
                
                # Clear any stale links
                conn.execute("DELETE FROM report_articles WHERE report_id = ?", (report_id,))
                
                # 2. Link selected articles
                for article in report.articles:
                    # Find article ID
                    cursor = conn.execute("SELECT id FROM articles WHERE link_hash = ? OR link = ?", (article.link_hash, article.link))
                    art_row = cursor.fetchone()
                    if art_row:
                        art_id = art_row["id"]
                        conn.execute(
                            "INSERT OR IGNORE INTO report_articles (report_id, article_id) VALUES (?, ?)",
                            (report_id, art_id)
                        )
                conn.commit()
            logger.info(f"DailyReport for {date_str} successfully persisted in database.")
        except sqlite3.Error as e:
            logger.error(f"Failed to save DailyReport for {date_str}: {e}", exc_info=True)

    def get_daily_report(self, report_date: date) -> Optional[DailyReport]:
        """Retrieves a pre-computed DailyReport for a specific date from the database."""
        date_str = report_date.isoformat()
        try:
            with self._get_connection() as conn:
                # 1. Get report details
                cursor = conn.execute(
                    """
                    SELECT id, report_date, biggest_announcement, biggest_trend, one_thing_to_know, reading_time_saved_minutes
                    FROM daily_reports
                    WHERE report_date = ?
                    """,
                    (date_str,)
                )
                rep_row = cursor.fetchone()
                if not rep_row:
                    return None
                    
                report_id = rep_row["id"]
                
                # 2. Get associated articles
                art_cursor = conn.execute(
                    """
                    SELECT a.link_hash, a.title, a.link, a.published_at, a.summary, a.source, a.ai_summary, a.category, a.priority, a.why_it_matters, a.reading_time, a.is_relevant
                    FROM articles a
                    JOIN report_articles ra ON a.id = ra.article_id
                    WHERE ra.report_id = ?
                    """,
                    (report_id,)
                )
                art_rows = art_cursor.fetchall()
                articles = [
                    Article(
                        title=row["title"],
                        link=row["link"],
                        published_at=row["published_at"],
                        summary=row["summary"],
                        source=row["source"],
                        ai_summary=row["ai_summary"],
                        category=row["category"],
                        priority=row["priority"],
                        why_it_matters=row["why_it_matters"],
                        is_relevant=bool(row["is_relevant"]),
                        reading_time=row["reading_time"],
                        link_hash=row["link_hash"]
                    )
                    for row in art_rows
                ]
                
                return DailyReport(
                    report_date=datetime.strptime(rep_row["report_date"], "%Y-%m-%d").date(),
                    biggest_announcement=rep_row["biggest_announcement"],
                    biggest_trend=rep_row["biggest_trend"],
                    one_thing_to_know=rep_row["one_thing_to_know"],
                    reading_time_saved_minutes=rep_row["reading_time_saved_minutes"],
                    articles=articles
                )
        except Exception as e:
            logger.error(f"Error loading DailyReport for {date_str}: {e}", exc_info=True)
            return None
