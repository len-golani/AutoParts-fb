"""
Parts Catalog Router — Phase 1
Serves static seed data (JSON files). Phase 2 will migrate to Supabase.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import json
import os

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def _load_seed(filename: str) -> dict:
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r") as f:
        return json.load(f)


@router.get("/brands")
async def get_brands():
    """Return all available automotive brands."""
    data = _load_seed("brands.json")
    return data


@router.get("/popular-models")
async def get_popular_models():
    """Return the 5 featured models for the homepage."""
    data = _load_seed("popular_models.json")
    return data


@router.get("/brands/{brand_slug}/models")
async def get_models_by_brand(brand_slug: str):
    """Return all models for a given brand slug."""
    data = _load_seed("brands.json")
    brand = next((b for b in data["brands"] if b["slug"] == brand_slug), None)
    if not brand:
        raise HTTPException(status_code=404, detail=f"Brand '{brand_slug}' not found.")
    return brand


@router.get("/search")
async def search_catalog(
    q: str = Query(..., min_length=1),
    brand: Optional[str] = None,
    year: Optional[int] = None,
):
    """Simple text search across models (Phase 2 will use full-text DB search)."""
    data = _load_seed("brands.json")
    q_lower = q.lower()
    results = []

    for b in data["brands"]:
        if brand and b["slug"] != brand:
            continue
        for m in b.get("models", []):
            if q_lower in m["name"].lower() or q_lower in b["name"].lower():
                if year and year not in m.get("years", []):
                    continue
                results.append({
                    "brand": b["name"],
                    "brand_slug": b["slug"],
                    "model": m["name"],
                    "model_slug": m["slug"],
                    "years": m.get("years", []),
                    "category": b.get("origin", ""),
                })

    return {"query": q, "count": len(results), "results": results}
