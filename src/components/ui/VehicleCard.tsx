import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Fuel, Settings, Gauge, MapPin, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { findCatalogBrand } from '../../services/catalog';
import type { Brand, VINDecodeResult } from '../../types';
import styles from './VehicleCard.module.css';

interface VehicleCardProps {
  result: VINDecodeResult;
  catalogBrands: Brand[] | null;
}

const PRIORITY_SPECS = [
  'Make', 'Model', 'Model Year', 'Trim', 'Body Class',
  'Doors', 'Drive Type', 'Engine Number of Cylinders',
  'Displacement (L)', 'Fuel Type - Primary', 'Transmission Style',
  'Plant Country', 'Plant City', 'Series',
];

export default function VehicleCard({ result, catalogBrands }: VehicleCardProps) {
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const catalogBrand = findCatalogBrand(catalogBrands, result.make);

  const specs = showAllSpecs
    ? result.all_specs.filter(s => s.value)
    : result.all_specs.filter(s => s.value && PRIORITY_SPECS.includes(s.variable));

  const quickStats = [
    { icon: <Car size={16} />, label: 'Vehicle', value: `${result.year} ${result.make} ${result.model}` },
    { icon: <Settings size={16} />, label: 'Engine', value: result.engine || result.cylinders ? `${result.cylinders ? result.cylinders + '-cyl' : ''} ${result.displacement_l ? result.displacement_l + 'L' : ''}`.trim() : null },
    { icon: <Fuel size={16} />, label: 'Fuel', value: result.fuel_type },
    { icon: <Gauge size={16} />, label: 'Drive', value: result.drive_type },
    { icon: <MapPin size={16} />, label: 'Made in', value: result.plant_country ? `${result.plant_city || ''} ${result.plant_country}`.trim() : null },
  ].filter(s => s.value);

  return (
    <div className={`card ${styles.card} animate-slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.checkBadge}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="eyebrow">VIN Decoded</p>
            <h2 className={styles.vehicleName}>
              {result.year} {result.make} {result.model}
              {result.trim && <span className={styles.trim}> {result.trim}</span>}
            </h2>
          </div>
        </div>
        <div className={styles.vinBadge}>
          <span className={styles.vinLabel}>VIN</span>
          <span className={styles.vinValue}>{result.vin}</span>
        </div>
      </div>

      {/* Quick stat strip */}
      <div className={styles.statStrip}>
        {quickStats.map((stat, i) => (
          <div key={i} className={styles.stat}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <div>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Spec table */}
      {specs.length > 0 && (
        <div className={styles.specSection}>
          <p className={styles.specTitle}>Technical Specifications</p>
          <div className={styles.specGrid}>
            {specs.map((spec, i) => (
              <div key={i} className={styles.specRow}>
                <span className={styles.specKey}>{spec.variable}</span>
                <span className={styles.specVal}>{spec.value}</span>
              </div>
            ))}
          </div>

          {result.all_specs.filter(s => s.value).length > PRIORITY_SPECS.length && (
            <button
              className={styles.toggleSpecs}
              onClick={() => setShowAllSpecs(!showAllSpecs)}
            >
              {showAllSpecs ? (
                <><ChevronUp size={14} /> Show fewer specs</>
              ) : (
                <><ChevronDown size={14} /> Show all {result.all_specs.filter(s => s.value).length} specs</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Error warning */}
      {result.error_text && (
        <div className={styles.warning}>
          ⚠️ {result.error_text}
        </div>
      )}

      {/* CTA */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          Found your vehicle — parts catalog coming in Phase 2
        </p>
        {catalogBrand ? (
          <Link to={`/catalog/${catalogBrand.slug}`} className="btn btn-ghost">
            Browse {result.make} Parts
          </Link>
        ) : (
          <button className="btn btn-ghost" disabled>
            {result.make ? `Parts catalog for ${result.make} coming soon` : 'Parts catalog coming soon'}
          </button>
        )}
      </div>
    </div>
  );
}
