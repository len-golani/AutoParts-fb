import type {
  VINDecodeResult,
  BrandsResponse,
  PopularModelsResponse,
  SearchResponse,
} from '../types';
import {
  decodeVin,
  getAllMakes,
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
    return getAllMakes();
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

  search: async (q: string, brand?: string, year?: number): Promise<SearchResponse> => {
    const qLower = q.toLowerCase();
    const results: SearchResponse['results'] = [];

    for (const b of (brandsData as BrandsResponse).brands) {
      if (brand && b.slug !== brand) continue;
      for (const m of b.models) {
        if (m.name.toLowerCase().includes(qLower) || b.name.toLowerCase().includes(qLower)) {
          if (year && !m.years.includes(year)) continue;
          results.push({
            brand: b.name,
            brand_slug: b.slug,
            model: m.name,
            model_slug: m.slug,
            years: m.years,
            category: b.origin,
          });
        }
      }
    }

    return { query: q, count: results.length, results };
  },
};
