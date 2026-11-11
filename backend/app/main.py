"""AutoParts API — FastAPI Backend
Phase 1: VIN Decoder + Vehicle Catalog Foundation
"""

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.routers import catalog, health, vin

load_dotenv()

app = FastAPI(
    title="AutoParts API",
    description="Proprietary automotive exploded parts catalog API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(vin.router, prefix="/api/vin", tags=["VIN Decoder"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["Parts Catalog"])


@app.get("/")
async def root():
    return {
        "message": "AutoParts API v1.0",
        "docs": "/api/docs",
        "phase": 1,
    }