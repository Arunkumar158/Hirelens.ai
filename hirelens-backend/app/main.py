import logging

import nltk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.routes.analyze import router as analyze_router
from app.api.v1.routes.results import router as results_router
from app.core.config import settings

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HireLens API",
    version="1.0.0",
    description="AI-Powered Resume Screening API — TF-IDF cosine similarity engine backed by Supabase.",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------


@app.on_event("startup")
async def startup_event() -> None:
    """Download NLTK resources required for stopword removal."""
    logger.info("Downloading NLTK stopwords corpus …")
    nltk.download("stopwords", quiet=True)
    logger.info("NLTK stopwords ready.")


# ---------------------------------------------------------------------------
# Global exception handler — uniform error shape
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error.", "code": 500},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(analyze_router, prefix="/api/v1")
app.include_router(results_router, prefix="/api/v1")

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "version": "1.0.0"}
