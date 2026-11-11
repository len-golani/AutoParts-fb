"""
VIN Decoder Router
Uses NHTSA vPIC API (free, no key required):
https://vpic.nhtsa.dot.gov/api/
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, validator
from typing import Optional, List
import httpx
import re

router = APIRouter()

NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles"


# ─── Models ──────────────────────────────────────────────────────────────────

class VehicleSpec(BaseModel):
    variable: str
    value: Optional[str]
    variable_id: Optional[int] = None


class VINDecodeResult(BaseModel):
    vin: str
    make: Optional[str]
    model: Optional[str]
    year: Optional[str]
    trim: Optional[str]
    engine: Optional[str]
    fuel_type: Optional[str]
    transmission: Optional[str]
    drive_type: Optional[str]
    body_class: Optional[str]
    doors: Optional[str]
    plant_country: Optional[str]
    plant_city: Optional[str]
    vehicle_type: Optional[str]
    series: Optional[str]
    displacement_l: Optional[str]
    cylinders: Optional[str]
    all_specs: List[VehicleSpec] = []
    error_code: Optional[str] = None
    error_text: Optional[str] = None


class MakeModel(BaseModel):
    make_id: int
    make_name: str


class ModelResult(BaseModel):
    model_id: int
    model_name: str
    make_id: int
    make_name: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _extract(results: list, variable_name: str) -> Optional[str]:
    """Extract a specific variable from NHTSA results list."""
    for item in results:
        if item.get("Variable") == variable_name:
            val = item.get("Value")
            if val and str(val).strip() not in ("", "Not Applicable", "null", "None"):
                return str(val).strip()
    return None


def _validate_vin(vin: str) -> str:
    vin = vin.strip().upper()
    if not re.match(r"^[A-HJ-NPR-Z0-9]{17}$", vin):
        raise HTTPException(
            status_code=400,
            detail="Invalid VIN: must be exactly 17 alphanumeric characters (no I, O, or Q).",
        )
    return vin


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("/decode/{vin}", response_model=VINDecodeResult)
async def decode_vin(vin: str):
    """
    Decode a 17-character VIN using the free NHTSA vPIC API.
    Returns make, model, year, engine, and full spec list.
    """
    vin = _validate_vin(vin)

    url = f"{NHTSA_BASE}/DecodeVinValues/{vin}?format=json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="NHTSA API timeout. Please retry.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"NHTSA API error: {e.response.status_code}")

    data = resp.json()
    results_list = data.get("Results", [{}])

    # DecodeVinValues returns a flat dict in Results[0]
    if not results_list:
        raise HTTPException(status_code=404, detail="No results returned for this VIN.")

    r = results_list[0]

    def get(key: str) -> Optional[str]:
        val = r.get(key, "")
        return val if val and val.strip() not in ("", "Not Applicable") else None

    # Build clean all_specs list (exclude empty)
    all_specs = []
    # We'll fetch verbose decode for the all_specs sidebar
    url_verbose = f"{NHTSA_BASE}/DecodeVin/{vin}?format=json"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp2 = await client.get(url_verbose)
            verbose_results = resp2.json().get("Results", [])
            all_specs = [
                VehicleSpec(
                    variable=item["Variable"],
                    value=item["Value"] if item["Value"] not in ("", None, "Not Applicable") else None,
                    variable_id=item.get("VariableId"),
                )
                for item in verbose_results
                if item.get("Value") and item["Value"] not in ("", "Not Applicable", "null")
            ]
        except Exception:
            pass  # all_specs is optional enrichment

    error_code = get("ErrorCode")
    error_text = get("ErrorText")

    return VINDecodeResult(
        vin=vin,
        make=get("Make"),
        model=get("Model"),
        year=get("ModelYear"),
        trim=get("Trim"),
        engine=get("EngineModel"),
        fuel_type=get("FuelTypePrimary"),
        transmission=get("TransmissionStyle"),
        drive_type=get("DriveType"),
        body_class=get("BodyClass"),
        doors=get("Doors"),
        plant_country=get("PlantCountry"),
        plant_city=get("PlantCity"),
        vehicle_type=get("VehicleType"),
        series=get("Series"),
        displacement_l=get("DisplacementL"),
        cylinders=get("EngineCylinders"),
        all_specs=all_specs,
        error_code=error_code,
        error_text=error_text if error_code not in ("0", None) else None,
    )


@router.get("/makes", response_model=List[MakeModel])
async def get_all_makes():
    """Fetch all vehicle makes from NHTSA."""
    url = f"{NHTSA_BASE}/GetAllMakes?format=json"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            return [
                MakeModel(make_id=item["Make_ID"], make_name=item["Make_Name"])
                for item in data.get("Results", [])
            ]
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch makes: {str(e)}")


@router.get("/models/{make_id}")
async def get_models_for_make(
    make_id: int,
    year: Optional[int] = Query(None, ge=1900, le=2030),
):
    """Fetch models for a given make, optionally filtered by year."""
    if year:
        url = f"{NHTSA_BASE}/GetModelsForMakeIdYear/makeId/{make_id}/modelyear/{year}?format=json"
    else:
        url = f"{NHTSA_BASE}/GetModelsForMakeId/{make_id}?format=json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            return {
                "make_id": make_id,
                "year": year,
                "models": [
                    {
                        "model_id": item.get("Model_ID"),
                        "model_name": item.get("Model_Name"),
                        "make_name": item.get("Make_Name"),
                    }
                    for item in data.get("Results", [])
                ],
            }
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch models: {str(e)}")


@router.get("/years")
async def get_vehicle_years():
    """Return a list of model years (1981–current)."""
    import datetime
    current = datetime.datetime.now().year + 1
    return {"years": list(range(current, 1980, -1))}
