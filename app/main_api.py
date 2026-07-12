from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import router as api_v1_router
from app.utils.logging import setup_logging
from app.config.config import config

# Setup application logging
setup_logging(log_level=config.LOG_LEVEL)

app = FastAPI(
    title="OpsiAI SaaS API",
    description="Monolith REST API serving Today's AI briefings, articles feeds, and analytics for the OpsiAI platform.",
    version="1.0.0"
)

# CORS configuration to enable dashboard web client calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints router
app.include_router(api_v1_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "name": "OpsiAI Platform API",
        "version": "1.0.0",
        "documentation": "/docs"
    }
