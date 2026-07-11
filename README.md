# AI Daily Brief

AI Daily Brief is an automated tech newsletter pipeline designed to help DevOps Engineers, Backend Engineers, and Platform Architects keep up with the latest advancements in Artificial Intelligence and Cloud Engineering.

The application automatically pulls updates from trusted RSS feeds, filters for relevance against a whitelist of topics, uses Google's **Gemini AI** to generate structured executive summaries and categorizations, stores history in an **SQLite** database to prevent duplicate notifications, and sends a beautifully styled responsive HTML newsletter via **SMTP**.

---

## Key Features

- ⚙️ **Modular Backend Architecture**: Decoupled packages (collectors, models, database, summarizer, delivery, utils) for scalability and testability.
- 🗄️ **SQLite persistent storage**: Prevents processing or delivering the same article twice. 
- 🤖 **Gemini AI Integration**: Uses the modern `google-genai` SDK with **Pydantic schema validation** to output clean, structured JSON classifications.
- 📧 **Jinja2 Templating**: Renders responsive, glassmorphic dark-mode HTML email layouts grouped by topic alongside plaintext fallbacks.
- 🚀 **GitHub Actions GitOps Workflow**: Runs on a daily cron schedule, automatically persisting SQLite database states across ephemeral runner VMs by committing changes back to the repository.
- 🛡️ **Resilient Fault Tolerance**: Graceful fallback checks for placeholder configurations, macOS SSL certificate bypasses, and network failure catch blocks.

---

## Directory Structure

```text
ai-daily-brief/
├── .github/
│   └── workflows/
│       └── daily_brief.yml  # Scheduled GitHub Actions automation
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entrypoint & pipeline loop
│   ├── config/              # Environment variable loading & topics whitelists
│   ├── collectors/          # RSS parsing service (requests + feedparser)
│   ├── models/              # Immutable Article domain dataclass
│   ├── database/            # SQLite transaction helpers & schema migrations
│   ├── summarizer/          # Pydantic-based Gemini API structured analysis
│   ├── delivery/            # SMTP email templates (Jinja2 HTML & Plaintext)
│   └── utils/               # Log formats and directories setups
├── logs/                    # Application debug execution logs
├── .env.example             # Configuration variables blueprint
├── .gitignore               # Ignored local structures (logs, env, packages)
├── requirements.txt         # Package dependencies
└── README.md                # System documentation
```

---

## Getting Started (Local Setup)

### 1. Prerequisities
Make sure you have Python 3.10+ installed on your system.

### 2. Installation
Clone the repository and navigate into the folder:
```bash
git clone <your-repo-url>
cd ai-daily-brief
```

Set up a virtual environment and install the dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Setup
Copy the template configuration file:
```bash
cp .env.example .env
```

Open the `.env` file and replace the parameters with your details:
- **Gemini API Key**: Obtain a free tier key from [Google AI Studio](https://aistudio.google.com/).
- **SMTP Configuration**: Configure standard SMTP credentials (such as a Gmail address combined with a [Google App Password](https://support.google.com/accounts/answer/185833)).

### 4. Running the Pipeline
Run the entrypoint script:
```bash
python -m app.main
```

Check the generated log files at `logs/app.log` or view the local `daily_brief.db` SQLite file to inspect stored metadata.

---

## CI/CD Automation via GitHub Actions

This pipeline is fully configured for automated scheduling in the cloud.

### 1. Push to GitHub
Commit all tracked files and push your repository to GitHub:
```bash
git add .
git commit -m "feat: initial commit of AI Daily Brief pipeline"
git push origin main
```

### 2. Configure GitHub Settings
To allow the GitHub Actions runner to commit database updates back to your repository branch and inject credentials, set up the following:

#### A. Workflow Permissions (Required for state persistence)
1. Go to your repository **Settings** -> **Actions** -> **General**.
2. Scroll to the bottom to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Click **Save**.

#### B. Repository Secrets
Go to **Settings** -> **Secrets and variables** -> **Actions** and create the following **Repository Secrets**:
- `GEMINI_API_KEY`: Your Gemini API key.
- `SMTP_HOST`: e.g., `smtp.gmail.com`.
- `SMTP_PORT`: e.g., `587`.
- `SMTP_USERNAME`: Sender email address.
- `SMTP_PASSWORD`: App password for mail delivery.
- `EMAIL_FROM`: Sender email address.
- `EMAIL_TO`: Recipient email address.

---

## Topics whitelisted
By default, the daily brief filters out unrelated news and only categorizes articles matching these topics:
* Artificial Intelligence / OpenAI / Anthropic / Google AI / Gemini / Microsoft AI / Meta AI
* Open Source AI / LLMs / AI Agents / Hugging Face / NVIDIA AI
* Kubernetes / Docker / DevOps / Platform Engineering / Cloud Engineering / AWS / Azure / Terraform / GitHub Actions / ArgoCD / Helm
* MCP (Model Context Protocol) / LangGraph / CrewAI / Python
