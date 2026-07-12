# OpsiAI - AI Intelligence Platform & Briefing Pipeline

OpsiAI is a modern, clean-architecture AI intelligence platform designed to aggregate, analyze, categorize, and deliver high-value technical briefings for DevOps Engineers, Platform Architects, and Software Developers.

The system is built as a monolithic SaaS backend serving an interactive React dashboard web app alongside automated daily HTML email dispatches.

---

## Key Features

- ⚙️ **Clean Architecture & Domain-Driven Design**: Rigid separation between the domain entities, application services (summarization, report compilation), database repositories, and delivery adapters (FastAPI controllers, SMTP).
- 🗄️ **Persistent Report & Article Caching**: SQLite database dynamically logs processed articles using SHA-256 hashes (`link_hash`) to avoid duplicate scans. Generates and stores unified daily reports to eliminate redundant Gemini API requests on page refreshes.
- 🤖 **Google Gemini AI Integration**: Leverages the `google-genai` SDK using structured Pydantic schemas to validate JSON classifications, priority tagging (`Strategic`, `Important`, `Insights`), estimated reading times, and developer-oriented engineering summaries.
- ⚡ **FastAPI REST API**: Serving health states, historical article list queries, and pre-computed briefings directly to HTTP clients.
- 💻 **Premium React SaaS Dashboard**: A stunning Vite-based TypeScript web application styled with a premium Vanilla CSS layout, glassmorphic cards, collapsible summaries, stats meters, and interactive theme/category filters.
- 📧 **Jinja2 SMTP Delivery**: Renders responsive dark-mode HTML email briefings with personalized user name parsing and local timezone greetings (e.g. `Good Afternoon, Abhi 👋`).

---

## Directory Structure

```text
ai-daily-brief/
├── .github/
│   └── workflows/
│       └── daily_brief.yml  # Scheduled GitHub Actions automation cron
├── app/
│   ├── __init__.py
│   ├── main.py              # CLI entry point to run the daily cron job
│   ├── main_api.py          # FastAPI REST API server
│   ├── config/              # Config settings & topics whitelists
│   ├── domain/              # DDD Entities (Article, DailyReport, TakeawayAnalysis)
│   ├── services/            # Application services (ReportBuilder, InsightGenerator)
│   ├── infrastructure/      # Adapters (SQLiteArticleRepository)
│   ├── delivery/            # SMTP email templates & email dispatch services
│   └── utils/               # Log formats and directories setups
├── frontend/                # Vite React TS SaaS Dashboard
│   ├── src/
│   │   ├── components/      # Sidebar, SnapshotBar, Takeaways, ArticleFeed, Preferences
│   │   ├── services/        # Fetch API clients (endpoints fetchers)
│   │   ├── App.tsx          # React dashboard layout & loading frames
│   │   ├── index.css        # Premium Vanilla CSS design system styles
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── logs/                    # Application debug execution logs
├── .env.example             # Configuration variables blueprint
├── requirements.txt         # Python package dependencies
└── README.md                # System documentation
```

---

## Local Setup & Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js (v18+) & npm

### 2. Backend Installation & Configurations
Clone the repository and install the Python dependencies:
```bash
git clone <your-repo-url>
cd ai-daily-brief

# Create and activate virtualenv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Configure your environment variables:
```bash
cp .env.example .env
```
Open `.env` and configure:
- **GEMINI_API_KEY**: Create a free tier key from [Google AI Studio](https://aistudio.google.com/).
- **TIMEZONE**: (Optional, defaults to `"Asia/Kolkata"`).
- **SMTP Configurations**: Username and app password credentials for email dispatch.

### 3. Run the CLI Ingestion Cron
To manually run the RSS collector, AI summarizer, and dispatch the emails:
```bash
python -m app.main
```

### 4. Run the FastAPI REST Server
Start the API on port 8000:
```bash
uvicorn app.main_api:app --reload --port 8000
```
Visit `http://localhost:8000/docs` to test endpoints on Swagger.

### 5. Frontend Dashboard Installation & Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to load your interactive web dashboard.

---

## Production Deployment & CI/CD

### GitHub Actions Scheduled Jobs
The pipeline runs automatically inside GitHub Actions runners daily:
- **Actions Permissions**: Ensure the repository has `Read and write permissions` enabled under **Settings** -> **Actions** -> **General** to allow runner machines to commit SQLite updates back to the master branch.
- **Secrets**: Add all required credentials (`GEMINI_API_KEY`, `SMTP_USERNAME`, `EMAIL_TO`, etc.) under **Settings** -> **Secrets and variables** -> **Actions**.
