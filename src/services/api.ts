import type {
  VINDecodeResult,
  BrandsResponse,
  PopularModelsResponse,
} from '../types';
import {
  decodeVin,
  getCarMakes,
  getModelsForMake,
  getVehicleYears,
} from './nhtsa';
import brandsData from '../data/brands.json';
import popularModelsData from '../data/popular-models.json';

// ─── VIN Endpoints (direct NHTSA calls from browser) ────────────────────────

export const vinApi = {
  decode: async (vin: string): Promise<VINDecodeResult> => {
    return decodeVin(vin);
  },

  getYears: async (): Promise<number[]> => {
    return getVehicleYears();
  },

  getMakes: async () => {
    return getCarMakes();
  },

  getModels: async (makeId: number, year?: number) => {
    return getModelsForMake(makeId, year);
  },
};

// ─── Catalog Endpoints (local JSON seed data) ───────────────────────────────

export const catalogApi = {
  getBrands: async (): Promise<BrandsResponse> => {
    return brandsData as BrandsResponse;
  },

  getPopularModels: async (): Promise<PopularModelsResponse> => {
    return popularModelsData as PopularModelsResponse;
  },
};
