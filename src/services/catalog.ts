import type { Brand } from '../types';

const normalizeMake = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Find the local catalog brand matching an NHTSA make name, if the catalog covers it. */
export function findCatalogBrand(brands: Brand[] | null, make: string | null): Brand | null {
  if (!brands || !make) return null;
  const key = normalizeMake(make);
  return brands.find(brand => normalizeMake(brand.name) === key) ?? null;
}
