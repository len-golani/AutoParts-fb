/**
 * NHTSA vPIC API — Direct Client-Side Service
 *
 * Calls the NHTSA API directly from the browser (CORS supported).
 * No backend proxy needed. No API key required.
 *
 * API: https://vpic.nhtsa.dot.gov/api/
 */

import type { VINDecodeResult, VehicleSpec } from '../types';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const TIMEOUT_MS = 15000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`NHTSA returned ${resp.status}`);
    return (await resp.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function validateVin(vin: string): string {
  const clean = vin.trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(clean)) {
    throw new Error('Invalid VIN: must be exactly 17 alphanumeric characters (no I, O, or Q).');
  }
  return clean;
}

// ─── VIN Decode ──────────────────────────────────────────────────────────────

interface NhtsaDecoded {
  Make: string;
  Model: string;
  ModelYear: string;
  Trim: string;
  EngineModel: string;
  FuelTypePrimary: string;
  TransmissionStyle: string;
  DriveType: string;
  BodyClass: string;
  Doors: string;
  PlantCountry: string;
  PlantCity: string;
  VehicleType: string;
  Series: string;
  DisplacementL: string;
  EngineCylinders: string;
  ErrorCode: string;
  ErrorText: string;
}

interface NhtsaVerboseItem {
  Variable: string;
  Value: string;
  VariableId?: number;
}

function get(decoded: NhtsaDecoded, key: keyof NhtsaDecoded): string | null {
  const val = decoded[key];
  if (val && val.trim() !== '' && val.trim() !== 'Not Applicable') return val.trim();
  return null;
}

export async function decodeVin(vin: string): Promise<VINDecodeResult> {
  const clean = validateVin(vin);

  // Fetch concise decode (fast, flat fields)
  const conciseUrl = `${NHTSA_BASE}/DecodeVinValues/${clean}?format=json`;
  const concise = await fetchJson<{ Results: NhtsaDecoded[] }>(conciseUrl);
  const r = concise.Results?.[0];

  if (!r) throw new Error('No results returned for this VIN.');

  const errorCode = get(r, 'ErrorCode');

  // ErrorCode "0" means success; anything else means partial/invalid
  if (errorCode && errorCode !== '0') {
    const errorText = get(r, 'ErrorText') || 'Could not fully decode this VIN.';
    throw new Error(errorText);
  }

  // Fetch verbose decode for all_specs sidebar (optional enrichment)
  let all_specs: VehicleSpec[] = [];
  try {
    const verboseUrl = `${NHTSA_BASE}/DecodeVin/${clean}?format=json`;
    const verbose = await fetchJson<{ Results: NhtsaVerboseItem[] }>(verboseUrl);
    all_specs = (verbose.Results || [])
      .filter(item => item.Value && item.Value !== '' && item.Value !== 'Not Applicable')
      .map(item => ({
        variable: item.Variable,
        value: item.Value,
        variable_id: item.VariableId,
      }));
  } catch {
    // all_specs is optional — don't fail the whole decode
  }

  return {
    vin: clean,
    make: get(r, 'Make'),
    model: get(r, 'Model'),
    year: get(r, 'ModelYear'),
    trim: get(r, 'Trim'),
    engine: get(r, 'EngineModel'),
    fuel_type: get(r, 'FuelTypePrimary'),
    transmission: get(r, 'TransmissionStyle'),
    drive_type: get(r, 'DriveType'),
    body_class: get(r, 'BodyClass'),
    doors: get(r, 'Doors'),
    plant_country: get(r, 'PlantCountry'),
    plant_city: get(r, 'PlantCity'),
    vehicle_type: get(r, 'VehicleType'),
    series: get(r, 'Series'),
    displacement_l: get(r, 'DisplacementL'),
    cylinders: get(r, 'EngineCylinders'),
    all_specs,
    error_code: errorCode,
    error_text: null,
  };
}

// ─── Makes ───────────────────────────────────────────────────────────────────

interface NhtsaMake {
  Make_ID: number;
  Make_Name: string;
}

export interface NhtsaMakeResult {
  make_id: number;
  make_name: string;
}

let _makesCache: NhtsaMakeResult[] | null = null;

export async function getAllMakes(): Promise<NhtsaMakeResult[]> {
  if (_makesCache) return _makesCache;
  const url = `${NHTSA_BASE}/GetAllMakes?format=json`;
  const data = await fetchJson<{ Results: NhtsaMake[] }>(url);
  _makesCache = (data.Results || []).map(item => ({
    make_id: item.Make_ID,
    make_name: item.Make_Name,
  }));
  return _makesCache;
}

// ─── Models ──────────────────────────────────────────────────────────────────

interface NhtsaModel {
  Model_ID: number;
  Model_Name: string;
  Make_ID: number;
  Make_Name: string;
}

export async function getModelsForMake(
  makeId: number,
  year?: number,
): Promise<{ make_id: number; year: number | null; models: { model_id: number; model_name: string }[] }> {
  let url: string;
  if (year) {
    url = `${NHTSA_BASE}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`;
  } else {
    url = `${NHTSA_BASE}/GetModelsForMakeId/${makeId}?format=json`;
  }
  const data = await fetchJson<{ Results: NhtsaModel[] }>(url);
  return {
    make_id: makeId,
    year: year || null,
    models: (data.Results || []).map(item => ({
      model_id: item.Model_ID,
      model_name: item.Model_Name,
    })),
  };
}

// ─── Years ───────────────────────────────────────────────────────────────────

export function getVehicleYears(): number[] {
  const current = new Date().getFullYear() + 1;
  return Array.from({ length: current - 1980 }, (_, i) => current - i);
}
