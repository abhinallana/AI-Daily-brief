import sqlite3
import logging
import hashlib
import pg8000
from datetime import date, datetime
from typing import List, Optional
from app.domain.entities import Article, DailyReport
from app.config.config import config

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
        prefs_schema = """
        CREATE TABLE IF NOT EXISTS user_preferences (
            email TEXT PRIMARY KEY,
            subscribed_topics TEXT
        );
        """
        profiles_schema = """
        CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT,
            email TEXT NOT NULL UNIQUE,
            avatar_url TEXT,
            newsletter_enabled INTEGER DEFAULT 0,
            preferred_topics TEXT,
            theme TEXT DEFAULT 'dark',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        try:
            with self._get_connection() as conn:
                conn.execute(schema)
                conn.execute(reports_schema)
                conn.execute(links_schema)
                conn.execute(prefs_schema)
                conn.execute(profiles_schema)
                
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

    def search_articles(self, query: str = None, from_date: str = None, to_date: str = None, limit: int = 100) -> List[Article]:
        """Searches all articles dynamically with keyword and date range filters in SQLite."""
        conditions = ["a.is_relevant = 1"]
        params = []
        
        if query:
            conditions.append("(a.title LIKE ? OR a.summary LIKE ? OR a.ai_summary LIKE ?)")
            q_param = f"%{query}%"
            params.extend([q_param, q_param, q_param])
            
        if from_date:
            conditions.append("r.report_date >= ?")
            params.append(from_date)
            
        if to_date:
            conditions.append("r.report_date <= ?")
            params.append(to_date)
            
        where_clause = " AND ".join(conditions)
        sql = f"""
        SELECT DISTINCT a.link_hash, a.title, a.link, a.published_at, a.summary, a.source, a.ai_summary, a.category, a.priority, a.why_it_matters, a.reading_time, a.is_relevant
        FROM articles a
        JOIN report_articles ra ON a.id = ra.article_id
        JOIN daily_reports r ON ra.report_id = r.id
        WHERE {where_clause}
        ORDER BY r.report_date DESC, a.id DESC
        LIMIT ?
        """
        params.append(limit)
        
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(sql, tuple(params))
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
            logger.error(f"SQLite search_articles failed: {e}", exc_info=True)
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

    def get_all_daily_reports(self) -> list:
        """Retrieves list of all saved DailyReports with ID, date and biggest announcement from SQLite."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    """
                    SELECT id, report_date, biggest_announcement
                    FROM daily_reports
                    ORDER BY report_date DESC
                    """
                )
                rows = cursor.fetchall()
                return [
                    {
                        "id": str(row["id"]),
                        "date": row["report_date"],
                        "biggest_announcement": row["biggest_announcement"] or ""
                    }
                    for row in rows
                ]
        except sqlite3.Error as e:
            logger.error(f"Failed to retrieve all DailyReports: {e}", exc_info=True)
            return []

    def get_metrics(self) -> dict:
        """Computes real-time statistics of analyzed articles and reports."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute("SELECT COUNT(*) FROM articles")
                articles_analyzed = cursor.fetchone()[0] or 0

                cursor = conn.execute("SELECT COUNT(DISTINCT source) FROM articles WHERE source IS NOT NULL AND source != ''")
                trusted_sources = cursor.fetchone()[0] or 0

                cursor = conn.execute("SELECT COUNT(*) FROM articles WHERE priority = 'Strategic'")
                strategic_insights = cursor.fetchone()[0] or 0

                cursor = conn.execute("SELECT COUNT(*) FROM daily_reports")
                reports_generated = cursor.fetchone()[0] or 0

                cursor = conn.execute("SELECT SUM(reading_time_saved_minutes) FROM daily_reports")
                row = cursor.fetchone()
                saved_minutes = row[0] if row and row[0] is not None else 0
                time_saved_hours = int(saved_minutes / 60)

                return {
                    "articles_analyzed": articles_analyzed,
                    "trusted_sources": trusted_sources,
                    "strategic_insights": strategic_insights,
                    "reports_generated": reports_generated,
                    "time_saved_hours": time_saved_hours
                }
        except Exception as e:
            logger.error(f"Error loading SQL metrics: {e}", exc_info=True)
            return {
                "articles_analyzed": 0,
                "trusted_sources": 0,
                "strategic_insights": 0,
                "reports_generated": 0,
                "time_saved_hours": 0
            }

    def get_weekly_topic_counts(self) -> dict:
        """Computes weekly article counts per category/topic from the last 7 days in SQLite."""
        try:
            from datetime import date, timedelta
            limit_date = (date.today() - timedelta(days=7)).isoformat()
            
            with self._get_connection() as conn:
                cursor = conn.execute("""
                    SELECT a.category, COUNT(*) 
                    FROM articles a
                    JOIN report_articles ra ON a.id = ra.article_id
                    JOIN daily_reports dr ON ra.report_id = dr.id
                    WHERE dr.report_date >= ? AND a.category IS NOT NULL AND a.category != ''
                    GROUP BY a.category
                """, (limit_date,))
                rows = cursor.fetchall()
                return {row[0]: row[1] for row in rows}
        except Exception as e:
            logger.error(f"Error loading SQLite weekly topic counts: {e}", exc_info=True)
            return {}

    def save_user_preferences(self, email: str, topics: list[str]) -> None:
        """Saves or updates active topic preferences for a user in SQLite."""
        topics_str = ",".join(topics)
        try:
            with self._get_connection() as conn:
                conn.execute(
                    "INSERT INTO user_preferences (email, subscribed_topics) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET subscribed_topics=?",
                    (email.strip().lower(), topics_str, topics_str)
                )
        except Exception as e:
            logger.error(f"Failed to save user preferences: {e}", exc_info=True)

    def get_user_preferences(self, email: str) -> list[str]:
        """Gets active topic preferences for a user in SQLite. Returns empty list if not found."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT subscribed_topics FROM user_preferences WHERE email = ?",
                    (email.strip().lower(),)
                )
                row = cursor.fetchone()
                if row and row["subscribed_topics"]:
                    return [t.strip() for t in row["subscribed_topics"].split(",") if t.strip()]
        except Exception as e:
            logger.error(f"Failed to load user preferences: {e}", exc_info=True)
        return []

    def save_user_profile(self, profile: dict) -> None:
        """Saves a user profile in SQLite."""
        try:
            with self._get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO user_profiles (id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        first_name = excluded.first_name,
                        last_name = excluded.last_name,
                        avatar_url = excluded.avatar_url,
                        newsletter_enabled = excluded.newsletter_enabled,
                        preferred_topics = excluded.preferred_topics,
                        theme = excluded.theme
                    """,
                    (
                        profile["id"],
                        profile["first_name"],
                        profile.get("last_name"),
                        profile["email"],
                        profile.get("avatar_url"),
                        1 if profile.get("newsletter_enabled") else 0,
                        profile.get("preferred_topics", ""),
                        profile.get("theme", "dark")
                    )
                )
        except Exception as e:
            logger.error(f"Failed to save user profile in SQLite: {e}", exc_info=True)

    def get_user_profile(self, profile_id: str) -> Optional[dict]:
        """Gets a user profile from SQLite."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme, created_at FROM user_profiles WHERE id = ?",
                    (profile_id,)
                )
                row = cursor.fetchone()
                if row:
                    return {
                        "id": row["id"],
                        "first_name": row["first_name"],
                        "last_name": row["last_name"],
                        "email": row["email"],
                        "avatar_url": row["avatar_url"],
                        "newsletter_enabled": bool(row["newsletter_enabled"]),
                        "preferred_topics": [t.strip() for t in row["preferred_topics"].split(",") if t.strip()] if row["preferred_topics"] else [],
                        "theme": row["theme"],
                        "created_at": row["created_at"]
                    }
        except Exception as e:
            logger.error(f"Failed to load user profile: {e}", exc_info=True)
        return None

    def get_profile_by_email(self, email: str) -> Optional[dict]:
        """Gets a user profile by email address from SQLite."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme, created_at FROM user_profiles WHERE LOWER(email) = LOWER(?)",
                    (email.strip(),)
                )
                row = cursor.fetchone()
                if row:
                    return {
                        "id": row["id"],
                        "first_name": row["first_name"],
                        "last_name": row["last_name"],
                        "email": row["email"],
                        "avatar_url": row["avatar_url"],
                        "newsletter_enabled": bool(row["newsletter_enabled"]),
                        "preferred_topics": [t.strip() for t in row["preferred_topics"].split(",") if t.strip()] if row["preferred_topics"] else [],
                        "theme": row["theme"],
                        "created_at": row["created_at"]
                    }
        except Exception as e:
            logger.error(f"Failed to load user profile by email: {e}", exc_info=True)
        return None

    def get_active_subscribers(self) -> list[dict]:
        """Gets all user profiles with newsletter_enabled = 1 from SQLite."""
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme, created_at FROM user_profiles WHERE newsletter_enabled = 1"
                )
                rows = cursor.fetchall()
                subscribers = []
                for row in rows:
                    subscribers.append({
                        "id": row["id"],
                        "first_name": row["first_name"],
                        "last_name": row["last_name"],
                        "email": row["email"],
                        "avatar_url": row["avatar_url"],
                        "newsletter_enabled": True,
                        "preferred_topics": [t.strip() for t in row["preferred_topics"].split(",") if t.strip()] if row["preferred_topics"] else [],
                        "theme": row["theme"],
                        "created_at": row["created_at"]
                    })
                return subscribers
        except Exception as e:
            logger.error(f"Failed to load active subscribers from SQLite: {e}", exc_info=True)
        return []

class PostgreSQLArticleRepository:
    def __init__(self, host, port, database, user, password):
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password
        self._init_db()

    def _get_connection(self):
        # Establish connection using pg8000
        return pg8000.connect(
            host=self.host,
            port=self.port,
            database=self.database,
            user=self.user,
            password=self.password
        )

    def _init_db(self):
        logger.info(f"Initializing PostgreSQL database at host: {self.host}")
        schema = """
        CREATE TABLE IF NOT EXISTS articles (
            id SERIAL PRIMARY KEY,
            link_hash VARCHAR(64) UNIQUE,
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
            id SERIAL PRIMARY KEY,
            report_date VARCHAR(10) UNIQUE,
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
        prefs_schema = """
        CREATE TABLE IF NOT EXISTS user_preferences (
            email VARCHAR(255) PRIMARY KEY,
            subscribed_topics TEXT
        );
        """
        profiles_schema = """
        CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255),
            email VARCHAR(255) NOT NULL UNIQUE,
            avatar_url TEXT,
            newsletter_enabled BOOLEAN DEFAULT FALSE,
            preferred_topics TEXT,
            theme VARCHAR(50) DEFAULT 'dark',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(schema)
                    cursor.execute(reports_schema)
                    cursor.execute(links_schema)
                    cursor.execute(prefs_schema)
                    cursor.execute(profiles_schema)
                    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_link_hash ON articles(link_hash)")
                conn.commit()
            logger.debug("PostgreSQL database initialized successfully.")
        except Exception as e:
            logger.critical(f"Failed to initialize PostgreSQL: {e}", exc_info=True)
            raise

    def save_articles(self, articles: List[Article]) -> int:
        """Saves a list of articles to PostgreSQL, ignoring duplicates."""
        query = """
        INSERT INTO articles (link_hash, title, link, published_at, summary, source, ai_summary, category, priority, why_it_matters, reading_time, is_relevant)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (link_hash) DO NOTHING
        """
        inserted_count = 0
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
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
                    cursor.executemany(query, data)
                    inserted_count = cursor.rowcount
                conn.commit()
            logger.info(f"Saved {inserted_count} new articles to the database.")
            return inserted_count
        except Exception as e:
            logger.error(f"Error saving articles to PostgreSQL: {e}", exc_info=True)
            return 0

    def is_duplicate(self, link: str) -> bool:
        """Checks if a given article link already exists in the database."""
        link_hash = hashlib.sha256(link.encode('utf-8')).hexdigest()
        query = "SELECT 1 FROM articles WHERE link_hash = %s OR link = %s LIMIT 1"
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (link_hash, link))
                    return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"Error checking duplicate link {link}: {e}", exc_info=True)
            return False

    def get_recent_articles(self, limit: int = 50, only_relevant: bool = True) -> List[Article]:
        """Fetches the most recently inserted articles from PostgreSQL."""
        if only_relevant:
            query = """
            SELECT link_hash, title, link, published_at, summary, source, ai_summary, category, priority, why_it_matters, reading_time, is_relevant
            FROM articles
            WHERE is_relevant = 1
            ORDER BY id DESC
            LIMIT %s
            """
        else:
            query = """
            SELECT link_hash, title, link, published_at, summary, source, ai_summary, category, priority, why_it_matters, reading_time, is_relevant
            FROM articles
            ORDER BY id DESC
            LIMIT %s
            """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (limit,))
                    rows = cursor.fetchall()
                    
                    columns = [col[0] for col in cursor.description]
                    return [
                        Article(
                            title=row[columns.index("title")],
                            link=row[columns.index("link")],
                            published_at=row[columns.index("published_at")],
                            summary=row[columns.index("summary")],
                            source=row[columns.index("source")],
                            ai_summary=row[columns.index("ai_summary")],
                            category=row[columns.index("category")],
                            priority=row[columns.index("priority")],
                            why_it_matters=row[columns.index("why_it_matters")],
                            is_relevant=bool(row[columns.index("is_relevant")]),
                            reading_time=row[columns.index("reading_time")],
                            link_hash=row[columns.index("link_hash")]
                        )
                        for row in rows
                    ]
        except Exception as e:
            logger.error(f"Error retrieving recent articles from PostgreSQL: {e}", exc_info=True)
            return []

    def search_articles(self, query: str = None, from_date: str = None, to_date: str = None, limit: int = 100) -> List[Article]:
        """Searches all articles dynamically with keyword and date range filters in PostgreSQL."""
        conditions = ["a.is_relevant = true"]
        params = []
        
        if query:
            conditions.append("(a.title ILIKE %s OR a.summary ILIKE %s OR a.ai_summary ILIKE %s)")
            q_param = f"%{query}%"
            params.extend([q_param, q_param, q_param])
            
        if from_date:
            conditions.append("r.report_date >= %s")
            params.append(from_date)
            
        if to_date:
            conditions.append("r.report_date <= %s")
            params.append(to_date)
            
        where_clause = " AND ".join(conditions)
        sql = f"""
        SELECT DISTINCT a.link_hash, a.title, a.link, a.published_at, a.summary, a.source, a.ai_summary, a.category, a.priority, a.why_it_matters, a.reading_time, a.is_relevant
        FROM articles a
        JOIN report_articles ra ON a.id = ra.article_id
        JOIN daily_reports r ON ra.report_id = r.id
        WHERE {where_clause}
        ORDER BY r.report_date DESC, a.id DESC
        LIMIT %s
        """
        params.append(limit)
        
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(sql, tuple(params))
                    rows = cursor.fetchall()
                    if rows:
                        columns = [col[0] for col in cursor.description]
                        return [
                            Article(
                                title=row[columns.index("title")],
                                link=row[columns.index("link")],
                                published_at=str(row[columns.index("published_at")]),
                                summary=row[columns.index("summary")],
                                source=row[columns.index("source")],
                                ai_summary=row[columns.index("ai_summary")],
                                category=row[columns.index("category")],
                                priority=row[columns.index("priority")],
                                why_it_matters=row[columns.index("why_it_matters")],
                                is_relevant=bool(row[columns.index("is_relevant")]),
                                reading_time=row[columns.index("reading_time")],
                                link_hash=row[columns.index("link_hash")]
                            )
                            for row in rows
                        ]
        except Exception as e:
            logger.error(f"PostgreSQL search_articles failed: {e}", exc_info=True)
        return []

    def save_daily_report(self, report: DailyReport) -> None:
        """Saves a DailyReport and links articles inside PostgreSQL."""
        date_str = report.report_date.isoformat()
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO daily_reports 
                        (report_date, biggest_announcement, biggest_trend, one_thing_to_know, reading_time_saved_minutes)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (report_date) DO UPDATE SET
                            biggest_announcement = EXCLUDED.biggest_announcement,
                            biggest_trend = EXCLUDED.biggest_trend,
                            one_thing_to_know = EXCLUDED.one_thing_to_know,
                            reading_time_saved_minutes = EXCLUDED.reading_time_saved_minutes
                        """,
                        (
                            date_str,
                            report.biggest_announcement,
                            report.biggest_trend,
                            report.one_thing_to_know,
                            report.reading_time_saved_minutes
                        )
                    )
                    
                    cursor.execute("SELECT id FROM daily_reports WHERE report_date = %s", (date_str,))
                    report_id = cursor.fetchone()[0]
                    
                    cursor.execute("DELETE FROM report_articles WHERE report_id = %s", (report_id,))
                    
                    for article in report.articles:
                        cursor.execute("SELECT id FROM articles WHERE link_hash = %s OR link = %s", (article.link_hash, article.link))
                        art_row = cursor.fetchone()
                        if art_row:
                            art_id = art_row[0]
                            cursor.execute(
                                "INSERT INTO report_articles (report_id, article_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                                (report_id, art_id)
                            )
                conn.commit()
            logger.info(f"DailyReport for {date_str} successfully persisted in PostgreSQL.")
        except Exception as e:
            logger.error(f"Failed to save DailyReport for {date_str} to PostgreSQL: {e}", exc_info=True)

    def get_daily_report(self, report_date: date) -> Optional[DailyReport]:
        """Loads a DailyReport from PostgreSQL database."""
        date_str = report_date.isoformat()
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id, report_date, biggest_announcement, biggest_trend, one_thing_to_know, reading_time_saved_minutes
                        FROM daily_reports
                        WHERE report_date = %s
                        """,
                        (date_str,)
                    )
                    rep_row = cursor.fetchone()
                    if not rep_row:
                        return None
                        
                    columns = [col[0] for col in cursor.description]
                    report_id = rep_row[columns.index("id")]
                    
                    cursor.execute(
                        """
                        SELECT a.link_hash, a.title, a.link, a.published_at, a.summary, a.source, a.ai_summary, a.category, a.priority, a.why_it_matters, a.reading_time, a.is_relevant
                        FROM articles a
                        JOIN report_articles ra ON a.id = ra.article_id
                        WHERE ra.report_id = %s
                        """,
                        (report_id,)
                    )
                    art_rows = cursor.fetchall()
                    art_columns = [col[0] for col in cursor.description]
                    
                    articles = [
                        Article(
                            title=row[art_columns.index("title")],
                            link=row[art_columns.index("link")],
                            published_at=row[art_columns.index("published_at")],
                            summary=row[art_columns.index("summary")],
                            source=row[art_columns.index("source")],
                            ai_summary=row[art_columns.index("ai_summary")],
                            category=row[art_columns.index("category")],
                            priority=row[art_columns.index("priority")],
                            why_it_matters=row[art_columns.index("why_it_matters")],
                            is_relevant=bool(row[art_columns.index("is_relevant")]),
                            reading_time=row[art_columns.index("reading_time")],
                            link_hash=row[art_columns.index("link_hash")]
                        )
                        for row in art_rows
                    ]
                    
                    return DailyReport(
                        report_date=datetime.strptime(rep_row[columns.index("report_date")], "%Y-%m-%d").date(),
                        biggest_announcement=rep_row[columns.index("biggest_announcement")],
                        biggest_trend=rep_row[columns.index("biggest_trend")],
                        one_thing_to_know=rep_row[columns.index("one_thing_to_know")],
                        reading_time_saved_minutes=rep_row[columns.index("reading_time_saved_minutes")],
                        articles=articles
                    )
        except Exception as e:
            logger.error(f"Error loading DailyReport for {date_str} from PostgreSQL: {e}", exc_info=True)
            return None

    def get_all_daily_reports(self) -> list:
        """Retrieves list of all saved DailyReports with ID, date and biggest announcement from PostgreSQL."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT id, report_date, biggest_announcement
                        FROM daily_reports
                        ORDER BY report_date DESC
                        """
                    )
                    rows = cursor.fetchall()
                    if rows:
                        columns = [col[0] for col in cursor.description]
                        return [
                            {
                                "id": str(row[columns.index("id")]),
                                "date": str(row[columns.index("report_date")]),
                                "biggest_announcement": row[columns.index("biggest_announcement")] or ""
                            }
                            for row in rows
                        ]
        except Exception as e:
            logger.error(f"Failed to retrieve all DailyReports from PostgreSQL: {e}", exc_info=True)
        return []

    def get_metrics(self) -> dict:
        """Computes real-time statistics of analyzed articles and reports from PostgreSQL."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM articles")
                    articles_analyzed = cursor.fetchone()[0] or 0

                    cursor.execute("SELECT COUNT(DISTINCT source) FROM articles WHERE source IS NOT NULL AND source != ''")
                    trusted_sources = cursor.fetchone()[0] or 0

                    cursor.execute("SELECT COUNT(*) FROM articles WHERE priority = 'Strategic'")
                    strategic_insights = cursor.fetchone()[0] or 0

                    cursor.execute("SELECT COUNT(*) FROM daily_reports")
                    reports_generated = cursor.fetchone()[0] or 0

                    cursor.execute("SELECT SUM(reading_time_saved_minutes) FROM daily_reports")
                    row = cursor.fetchone()
                    saved_minutes = row[0] if row and row[0] is not None else 0
                    time_saved_hours = int(saved_minutes / 60)

                    return {
                        "articles_analyzed": articles_analyzed,
                        "trusted_sources": trusted_sources,
                        "strategic_insights": strategic_insights,
                        "reports_generated": reports_generated,
                        "time_saved_hours": time_saved_hours
                    }
        except Exception as e:
            logger.error(f"Error loading SQL metrics from PostgreSQL: {e}", exc_info=True)
            return {
                "articles_analyzed": 0,
                "trusted_sources": 0,
                "strategic_insights": 0,
                "reports_generated": 0,
                "time_saved_hours": 0
            }

    def get_weekly_topic_counts(self) -> dict:
        """Computes weekly article counts per category/topic from the last 7 days in PostgreSQL."""
        try:
            from datetime import date, timedelta
            limit_date = date.today() - timedelta(days=7)
            
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT a.category, COUNT(*) 
                        FROM articles a
                        JOIN report_articles ra ON a.id = ra.article_id
                        JOIN daily_reports dr ON ra.report_id = dr.id
                        WHERE dr.report_date >= %s AND a.category IS NOT NULL AND a.category != ''
                        GROUP BY a.category
                    """, (limit_date,))
                    rows = cursor.fetchall()
                    return {row[0]: row[1] for row in rows}
        except Exception as e:
            logger.error(f"Error loading PostgreSQL weekly topic counts: {e}", exc_info=True)
            return {}

    def save_user_preferences(self, email: str, topics: list[str]) -> None:
        """Saves or updates active topic preferences for a user in PostgreSQL."""
        topics_str = ",".join(topics)
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO user_preferences (email, subscribed_topics) 
                        VALUES (%s, %s) 
                        ON CONFLICT (email) 
                        DO UPDATE SET subscribed_topics = EXCLUDED.subscribed_topics
                        """,
                        (email.strip().lower(), topics_str)
                    )
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to save user preferences in PostgreSQL: {e}", exc_info=True)

    def get_user_preferences(self, email: str) -> list[str]:
        """Gets active topic preferences for a user in PostgreSQL. Returns empty list if not found."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT subscribed_topics FROM user_preferences WHERE email = %s",
                        (email.strip().lower(),)
                    )
                    row = cursor.fetchone()
                    if row and row[0]:
                        return [t.strip() for t in row[0].split(",") if t.strip()]
        except Exception as e:
            logger.error(f"Failed to load user preferences from PostgreSQL: {e}", exc_info=True)
        return []

    def save_user_profile(self, profile: dict) -> None:
        """Saves or updates a user profile in PostgreSQL."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO public.user_profiles (id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT(id) DO UPDATE SET
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name,
                            avatar_url = EXCLUDED.avatar_url,
                            newsletter_enabled = EXCLUDED.newsletter_enabled,
                            preferred_topics = EXCLUDED.preferred_topics,
                            theme = EXCLUDED.theme
                        """,
                        (
                            profile["id"],
                            profile["first_name"],
                            profile.get("last_name"),
                            profile["email"],
                            profile.get("avatar_url"),
                            profile.get("newsletter_enabled") or False,
                            profile.get("preferred_topics", ""),
                            profile.get("theme", "dark")
                        )
                    )
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to save user profile in PostgreSQL: {e}", exc_info=True)

    def get_user_profile(self, profile_id: str) -> Optional[dict]:
        """Gets a user profile from PostgreSQL."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme, created_at FROM public.user_profiles WHERE id = %s",
                        (profile_id,)
                    )
                    row = cursor.fetchone()
                    if row:
                        columns = [col[0] for col in cursor.description]
                        pref_topics_str = row[columns.index("preferred_topics")]
                        return {
                            "id": str(row[columns.index("id")]),
                            "first_name": row[columns.index("first_name")],
                            "last_name": row[columns.index("last_name")],
                            "email": row[columns.index("email")],
                            "avatar_url": row[columns.index("avatar_url")],
                            "newsletter_enabled": bool(row[columns.index("newsletter_enabled")]),
                            "preferred_topics": [t.strip() for t in pref_topics_str.split(",") if t.strip()] if pref_topics_str else [],
                            "theme": row[columns.index("theme")],
                            "created_at": row[columns.index("created_at")].isoformat() if row[columns.index("created_at")] else None
                        }
        except Exception as e:
            logger.error(f"Failed to load user profile from PostgreSQL: {e}", exc_info=True)
        return None

    def get_profile_by_email(self, email: str) -> Optional[dict]:
        """Gets a user profile by email address from PostgreSQL."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme, created_at FROM public.user_profiles WHERE LOWER(email) = LOWER(%s)",
                        (email.strip(),)
                    )
                    row = cursor.fetchone()
                    if row:
                        columns = [col[0] for col in cursor.description]
                        pref_topics_str = row[columns.index("preferred_topics")]
                        return {
                            "id": str(row[columns.index("id")]),
                            "first_name": row[columns.index("first_name")],
                            "last_name": row[columns.index("last_name")],
                            "email": row[columns.index("email")],
                            "avatar_url": row[columns.index("avatar_url")],
                            "newsletter_enabled": bool(row[columns.index("newsletter_enabled")]),
                            "preferred_topics": [t.strip() for t in pref_topics_str.split(",") if t.strip()] if pref_topics_str else [],
                            "theme": row[columns.index("theme")],
                            "created_at": row[columns.index("created_at")].isoformat() if row[columns.index("created_at")] else None
                        }
        except Exception as e:
            logger.error(f"Failed to load user profile by email from PostgreSQL: {e}", exc_info=True)
        return None

    def get_active_subscribers(self) -> list[dict]:
        """Gets all user profiles with newsletter_enabled = true from PostgreSQL."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT id, first_name, last_name, email, avatar_url, newsletter_enabled, preferred_topics, theme, created_at FROM public.user_profiles WHERE newsletter_enabled = true"
                    )
                    rows = cursor.fetchall()
                    subscribers = []
                    columns = [col[0] for col in cursor.description]
                    for row in rows:
                        pref_topics_str = row[columns.index("preferred_topics")]
                        subscribers.append({
                            "id": str(row[columns.index("id")]),
                            "first_name": row[columns.index("first_name")],
                            "last_name": row[columns.index("last_name")],
                            "email": row[columns.index("email")],
                            "avatar_url": row[columns.index("avatar_url")],
                            "newsletter_enabled": True,
                            "preferred_topics": [t.strip() for t in pref_topics_str.split(",") if t.strip()] if pref_topics_str else [],
                            "theme": row[columns.index("theme")],
                            "created_at": row[columns.index("created_at")].isoformat() if row[columns.index("created_at")] else None
                        })
                    return subscribers
        except Exception as e:
            logger.error(f"Failed to load active subscribers from PostgreSQL: {e}", exc_info=True)
        return []

def get_repository():
    """Factory function returning the configured SQLite or PostgreSQL/Supabase database repository."""
    if config.DB_TYPE in ("postgres", "supabase") or config.DB_HOST != "":
        logger.info("Initializing PostgreSQL/Supabase Article Repository.")
        return PostgreSQLArticleRepository(
            host=config.DB_HOST,
            port=config.DB_PORT,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD
        )
    else:
        logger.info("Initializing SQLite Article Repository.")
        return SQLiteArticleRepository(config.DATABASE_PATH)
