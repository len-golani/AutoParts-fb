// ─── VIN Decoder Types ────────────────────────────────────────────────────────

export interface VehicleSpec {
  variable: string;
  value: string | null;
  variable_id?: number;
}

export interface VINDecodeResult {
  vin: string;
  make: string | null;
  model: string | null;
  year: string | null;
  trim: string | null;
  engine: string | null;
  fuel_type: string | null;
  transmission: string | null;
  drive_type: string | null;
  body_class: string | null;
  doors: string | null;
  plant_country: string | null;
  plant_city: string | null;
  vehicle_type: string | null;
  series: string | null;
  displacement_l: string | null;
  cylinders: string | null;
  all_specs: VehicleSpec[];
  error_code: string | null;
  error_text: string | null;
}

// ─── Catalog Types ───────────────────────────────────────────────────────────

export interface VehicleModel {
  name: string;
  slug: string;
  years: number[];
}

export interface Brand {
  name: string;
  slug: string;
  logo: string;
  origin: 'European' | 'Japanese' | 'American' | 'Korean' | string;
  popular: boolean;
  models: VehicleModel[];
}

export interface BrandsResponse {
  brands: Brand[];
}

export interface PopularModel {
  id: string;
  brand: string;
  brand_slug: string;
  model: string;
  model_slug: string;
  year: number;
  image: string;
  description: string;
  engine_options: string[];
  assemblies_count: number;
  parts_count: number;
  sample_assemblies: string[];
  tags: string[];
}

export interface PopularModelsResponse {
  popular_models: PopularModel[];
}

// ─── Search Types ────────────────────────────────────────────────────────────

export interface SearchResult {
  brand: string;
  brand_slug: string;
  model: string;
  model_slug: string;
  years: number[];
  category: string;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
}
