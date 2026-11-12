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

  // NHTSA reports problems as a comma-separated ErrorCode list. Only "0" is a
  // clean decode; the rest are advisories (a bad check digit is the usual one),
  // and the vehicle data is still returned. Fail only when there is no vehicle.
  const make = get(r, 'Make');
  const model = get(r, 'Model');
  const year = get(r, 'ModelYear');
  const errorText = get(r, 'ErrorText');

  if (!make && !model && !year) {
    throw new Error('NHTSA could not decode this VIN. Check the 17 characters and try again.');
  }

  const advisoryCodes = (errorCode ?? '')
    .split(',')
    .map(code => code.trim())
    .filter(code => code !== '' && code !== '0');

  const advisory =
    advisoryCodes.length === 0
      ? null
      : advisoryCodes.every(code => code === '1' || code === '2')
        ? 'The VIN check digit did not validate. Double-check the VIN for typos — the vehicle data below still came from NHTSA.'
        : `Decoded with warnings: ${errorText || 'some fields may be incomplete.'}`;

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
    make,
    model,
    year,
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
    error_text: advisory,
  };
}

// ─── Makes ───────────────────────────────────────────────────────────────────

interface NhtsaCarMake {
  MakeId: number;
  MakeName: string;
}

export interface NhtsaMakeResult {
  make_id: number;
  make_name: string;
}

// Cached promise so concurrent callers (e.g. React StrictMode) share one request.
let _carMakesPromise: Promise<NhtsaMakeResult[]> | null = null;

/** Car makes straight from NHTSA, so every make carries the ID NHTSA uses for model lookups. */
export async function getCarMakes(): Promise<NhtsaMakeResult[]> {
  if (!_carMakesPromise) {
    const url = `${NHTSA_BASE}/GetMakesForVehicleType/car?format=json`;
    _carMakesPromise = fetchJson<{ Results: NhtsaCarMake[] }>(url)
      .then(data =>
        (data.Results || [])
          .map(item => ({ make_id: item.MakeId, make_name: item.MakeName }))
          .sort((a, b) => a.make_name.localeCompare(b.make_name)),
      )
      .catch(err => {
        _carMakesPromise = null;
        throw err;
      });
  }
  return _carMakesPromise;
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

  // NHTSA lists the same model name under several model IDs (e.g. multiple
  // Sprinter variants), so keep only the first entry for each name.
  const modelsByName = new Map<string, { model_id: number; model_name: string }>();
  for (const item of data.Results || []) {
    const name = item.Model_Name?.trim();
    if (name && !modelsByName.has(name.toLowerCase())) {
      modelsByName.set(name.toLowerCase(), { model_id: item.Model_ID, model_name: name });
    }
  }

  return {
    make_id: makeId,
    year: year || null,
    models: [...modelsByName.values()],
  };
}

// ─── Years ───────────────────────────────────────────────────────────────────

export function getVehicleYears(): number[] {
  const current = new Date().getFullYear() + 1;
  return Array.from({ length: current - 1980 }, (_, i) => current - i);
}
