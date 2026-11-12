import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Globe } from 'lucide-react';
import { catalogApi } from '../services/api';
import type { Brand } from '../types';
import styles from './CatalogPage.module.css';

const REGIONS = ['All', 'European', 'Japanese', 'American', 'Korean'];

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('All');
  const query = searchParams.get('q') || '';

  const setQuery = (value: string) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (value) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    catalogApi.getBrands()
      .then(d => setBrands(d.brands))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return brands.filter(b => {
      const matchesRegion = region === 'All' || b.origin === region;
      const matchesQuery = !query ||
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.models.some(m => m.name.toLowerCase().includes(query.toLowerCase()));
      return matchesRegion && matchesQuery;
    });
  }, [brands, query, region]);

  const grouped = useMemo(() => {
    const g: Record<string, Brand[]> = {};
    filtered.forEach(b => {
      const key = region === 'All' ? b.origin : b.name[0].toUpperCase();
      if (!g[key]) g[key] = [];
      g[key].push(b);
    });
    return g;
  }, [filtered, region]);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <p className="eyebrow">Parts Catalog</p>
          <h1 className={styles.title}>Browse by Brand</h1>
          <p className={styles.subtitle}>
            {brands.length} brands · {brands.reduce((acc, b) => acc + b.models.length, 0)} models indexed
          </p>
        </div>

        {/* Search + filter bar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search brands or models…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.regionTabs}>
            {REGIONS.map(r => (
              <button
                key={r}
                className={`${styles.regionTab} ${region === r ? styles.regionActive : ''}`}
                onClick={() => setRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {query && (
          <p className={styles.resultCount}>
            {filtered.length} brand{filtered.length !== 1 ? 's' : ''} matching "{query}"
          </p>
        )}

        {/* Brand groups */}
        {loading ? (
          <div className={styles.skeletonGrid}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`card ${styles.skeleton}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Globe size={40} />
            <p>No brands found for "{query}"</p>
            <button className="btn btn-ghost" onClick={() => { setQuery(''); setRegion('All'); }}>
              Clear filters
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([group, groupBrands]) => (
            <div key={group} className={styles.group}>
              <div className={styles.groupHeader}>
                <span className={styles.groupLabel}>{group}</span>
                <span className={styles.groupCount}>{groupBrands.length}</span>
              </div>
              <div className={styles.brandGrid}>
                {groupBrands.map(brand => (
                  <Link
                    key={brand.slug}
                    to={`/catalog/${brand.slug}`}
                    className={`card ${styles.brandCard}`}
                  >
                    <div className={styles.brandTop}>
                      <div className={styles.brandInitial}>
                        {brand.name[0]}
                      </div>
                      <div>
                        <h3 className={styles.brandName}>{brand.name}</h3>
                        <span className={styles.brandOrigin}>{brand.origin}</span>
                      </div>
                    </div>
                    <div className={styles.brandModels}>
                      {brand.models.slice(0, 4).map(m => (
                        <span key={m.slug} className={styles.modelPill}>{m.name}</span>
                      ))}
                      {brand.models.length > 4 && (
                        <span className={`${styles.modelPill} ${styles.modelMore}`}>
                          +{brand.models.length - 4}
                        </span>
                      )}
                    </div>
                    <div className={styles.brandFooter}>
                      <span className={styles.modelCount}>{brand.models.length} models</span>
                      <ChevronRight size={14} className={styles.arrow} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
