"""
main.py — FastAPI application entry point for the MediLens WhatsApp service.

Start with:
    uvicorn main:app --reload --port 8002

The existing FastAPI backend (backend_old) runs on port 8001.
This WhatsApp service runs on port 8002.
"""
import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("whatsapp_service.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# ── Config validation (fail fast if env is incomplete) ────────────────────────
from config import validate_config

# ── Database ───────────────────────────────────────────────────────────────────
import database

# ── Routes ─────────────────────────────────────────────────────────────────────
from routes.profile_routes import router as profile_router
from routes.report_routes import router as report_router


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup: validate config and ensure DB table exists."""
    logger.info("🚀 MediLens WhatsApp Service starting up...")
    try:
        validate_config()
        database.ensure_table_exists()
        logger.info("✅ Config and DB ready.")
    except EnvironmentError as e:
        logger.critical("❌ Startup failed — missing config: %s", e)
        sys.exit(1)
    except Exception as e:
        logger.critical("❌ DB init failed: %s", e)
        sys.exit(1)
    yield
    logger.info("🛑 WhatsApp Service shutting down.")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MediLens WhatsApp Integration",
    description=(
        "Handles WhatsApp Cloud API (Meta) integration for MediLens.\n\n"
        "• Saves user phone numbers\n"
        "• Sends greeting on registration\n"
        "• Delivers PDF report after analysis\n"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend and same-server backend to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "http://localhost:8001",   # Main FastAPI backend
        "https://medilens.ai",     # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routes ────────────────────────────────────────────────────────────
app.include_router(profile_router)
app.include_router(report_router)


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check service logs."},
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Status"])
async def health():
    """Simple health check — returns 200 if the service is running."""
    return {"status": "ok", "service": "MediLens WhatsApp API"}


# ── Root info ─────────────────────────────────────────────────────────────────
@app.get("/", tags=["Status"])
async def root():
    return {
        "service": "MediLens WhatsApp Integration",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "POST /api/profile/update-phone",
            "POST /api/report/analysis-complete",
        ],
    }


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
