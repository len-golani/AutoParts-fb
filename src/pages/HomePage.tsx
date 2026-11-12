import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Database, Box, Globe } from 'lucide-react';
import { catalogApi } from '../services/api';
import type { PopularModel } from '../types';
import styles from './HomePage.module.css';

const FEATURES = [
  { icon: <Zap size={20} />, title: 'VIN Decoder', desc: 'Instant identification via NHTSA database — no account needed', href: '/vin' },
  { icon: <Database size={20} />, title: 'Parts Catalog', desc: '100+ brands, hierarchical navigation from brand → assembly → part', href: '/catalog' },
  { icon: <Box size={20} />, title: '3D Exploded Views', desc: 'Interactive WebGL diagrams with clickable parts — Coming Phase 4', href: '/vin' },
  { icon: <Globe size={20} />, title: 'Global Coverage', desc: 'European, Japanese, American, Korean manufacturers', href: '/catalog' },
];

export default function HomePage() {
  const [models, setModels] = useState<PopularModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    catalogApi.getPopularModels()
      .then(d => setModels(d.popular_models))
      .catch(() => {})
      .finally(() => setLoadingModels(false));
  }, []);

  const openModel = (brandSlug: string) => navigate(`/catalog/${brandSlug}`);

  const handleModelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, brandSlug: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModel(brandSlug);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <p className="eyebrow">Proprietary · Free VIN Decoder · No Account Required</p>
            <h1 className={styles.heroTitle}>
              Find OEM parts for<br />
              <span className={styles.heroAccent}>any vehicle</span>
            </h1>
            <p className={styles.heroSub}>
              VIN decoding and parts catalogs for 100+ automotive brands.
              Powered by the free NHTSA vPIC database — no API key required.
            </p>
            <div className={styles.heroCTA}>
              <Link to="/vin" className="btn btn-primary">
                Decode a VIN <ArrowRight size={16} />
              </Link>
              <Link to="/catalog" className="btn btn-ghost">
                Browse Catalog
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.heroStats}>
            {[
              { value: '100+', label: 'Brands' },
              { value: '1,000+', label: 'Models' },
              { value: 'Free', label: 'Forever' },
              { value: 'No Key', label: 'Required' },
            ].map((s, i) => (
              <div key={i} className={styles.heroStat}>
                <span className={styles.heroStatValue}>{s.value}</span>
                <span className={styles.heroStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <Link key={i} to={f.href} className={`card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
                <span className={styles.featureArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Models ── */}
      <section className={styles.models}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className="eyebrow">Featured Vehicles</p>
              <h2 className={styles.sectionTitle}>Popular Models</h2>
            </div>
            <Link to="/catalog" className="btn btn-ghost">
              View all brands <ArrowRight size={15} />
            </Link>
          </div>

          {loadingModels ? (
            <div className={styles.loadingGrid}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`card ${styles.modelSkeleton}`} />
              ))}
            </div>
          ) : (
            <div className={styles.modelGrid}>
              {models.map(m => (
                <div
                  key={m.id}
                  className={`card ${styles.modelCard}`}
                  onClick={() => openModel(m.brand_slug)}
                  onKeyDown={e => handleModelKeyDown(e, m.brand_slug)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Brand badge */}
                  <div className={styles.modelHeader}>
                    <span className={styles.modelBrand}>{m.brand}</span>
                    <span className={styles.modelYear}>{m.year}</span>
                  </div>

                  <h3 className={styles.modelName}>{m.model}</h3>
                  <p className={styles.modelDesc}>{m.description}</p>

                  {/* Tags */}
                  <div className={styles.modelTags}>
                    {m.tags.map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>

                  {/* Engine options */}
                  <div className={styles.modelEngines}>
                    {m.engine_options.slice(0, 2).map(e => (
                      <span key={e} className="badge badge-amber">{e}</span>
                    ))}
                    {m.engine_options.length > 2 && (
                      <span className="badge badge-ice">+{m.engine_options.length - 2}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Phase Roadmap ── */}
      <section className={styles.roadmap}>
        <div className="container">
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '8px' }}>Development Roadmap</p>
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '32px' }}>
            Building in public, phase by phase
          </h2>
          <div className={styles.phaseList}>
            {[
              { n: 1, name: 'VIN Decoder & Vehicle Lookup', done: true },
              { n: 2, name: 'Parts Catalog Database & Navigation', done: false },
              { n: 3, name: '2D Exploded Diagrams & Viewer', done: false },
              { n: 4, name: '3D Exploded Views (Three.js + glTF)', done: false },
              { n: 5, name: 'Smart Search, Compatibility & AI', done: false },
              { n: 6, name: 'User Accounts & Marketplace', done: false },
              { n: 7, name: 'Scaling, SEO & Production', done: false },
            ].map(p => (
              <div key={p.n} className={`${styles.phase} ${p.done ? styles.phaseDone : ''}`}>
                <span className={styles.phaseNum}>
                  {p.done ? '✓' : `0${p.n}`}
                </span>
                <span className={styles.phaseName}>{p.name}</span>
                {p.done && <span className="badge badge-success">Live</span>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
