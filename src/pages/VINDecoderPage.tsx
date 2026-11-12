import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, ChevronDown } from 'lucide-react';
import VINScanner from '../components/ui/VINScanner';
import VehicleCard from '../components/ui/VehicleCard';
import { vinApi, catalogApi } from '../services/api';
import { findCatalogBrand } from '../services/catalog';
import type { NhtsaMakeResult } from '../services/nhtsa';
import type { Brand, VINDecodeResult } from '../types';
import styles from './VINDecoderPage.module.css';

export default function VINDecoderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<VINDecodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [tab, setTab] = useState<'vin' | 'manual'>('vin');

  // Manual selector state
  const [makes, setMakes] = useState<NhtsaMakeResult[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [makesError, setMakesError] = useState(false);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [models, setModels] = useState<{ model_id: number; model_name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [catalogBrands, setCatalogBrands] = useState<Brand[] | null>(null);
  const modelRequest = useRef(0);

  const urlVin = searchParams.get('vin');
  const lastUrlVin = useRef<string | null>(null);

  // Load years
  useEffect(() => {
    vinApi.getYears().then(setYears).catch(() => {});
  }, []);

  // Load car makes from NHTSA (each make carries NHTSA's own ID)
  useEffect(() => {
    let cancelled = false;
    vinApi
      .getMakes()
      .then(list => {
        if (!cancelled) setMakes(list);
      })
      .catch(() => {
        if (!cancelled) setMakesError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingMakes(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the local catalog so the manual CTA never links to an uncatalogued make
  useEffect(() => {
    let cancelled = false;
    catalogApi
      .getBrands()
      .then(data => {
        if (!cancelled) setCatalogBrands(data.brands);
      })
      .catch(() => {
        if (!cancelled) setCatalogBrands([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadModels = (makeName: string, year: string) => {
    const makeId = makes.find(m => m.make_name === makeName)?.make_id;
    const request = ++modelRequest.current;

    if (!makeId) {
      setModels([]);
      setLoadingModels(false);
      return;
    }

    setLoadingModels(true);
    vinApi
      .getModels(makeId, year ? parseInt(year, 10) : undefined)
      .then(data => {
        if (request === modelRequest.current) setModels(data.models || []);
      })
      .catch(() => {
        if (request === modelRequest.current) setModels([]);
      })
      .finally(() => {
        if (request === modelRequest.current) setLoadingModels(false);
      });
  };

  const handleMakeChange = (makeName: string) => {
    setSelectedMake(makeName);
    setSelectedModel('');
    loadModels(makeName, selectedYear);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedModel('');
    if (selectedMake) loadModels(selectedMake, year);
  };

  const handleDecode = useCallback(async (vin: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await vinApi.decode(vin);
      setResult(data);
      lastUrlVin.current = vin;
      setSearchParams({ vin });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to decode VIN');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Auto-decode a VIN from the URL, but never re-decode one we just handled
  useEffect(() => {
    if (urlVin && urlVin.length === 17 && urlVin !== lastUrlVin.current) {
      lastUrlVin.current = urlVin;
      handleDecode(urlVin);
    }
  }, [urlVin, handleDecode]);

  const catalogBrand = findCatalogBrand(catalogBrands, selectedMake);
  const canBrowseParts = Boolean(selectedMake && selectedModel && catalogBrand);
  const isUncataloguedMake = Boolean(selectedMake && catalogBrands && !catalogBrand);

  const handleManualSearch = () => {
    if (!catalogBrand || !selectedModel) return;
    // Phase 1: navigate to the matching brand page — full lookup in Phase 2
    window.location.href = `/catalog/${catalogBrand.slug}`;
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Page header */}
        <div className={styles.pageHeader}>
          <p className="eyebrow">Phase 1 — Fully Live</p>
          <h1 className={styles.title}>VIN Decoder</h1>
          <p className={styles.subtitle}>
            Enter a 17-character Vehicle Identification Number to decode make, model, engine, and full specs.
            Powered by the free NHTSA vPIC database.
          </p>
        </div>

        {/* Tab switcher */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'vin' ? styles.tabActive : ''}`}
            onClick={() => setTab('vin')}
          >
            By VIN Number
          </button>
          <button
            className={`${styles.tab} ${tab === 'manual' ? styles.tabActive : ''}`}
            onClick={() => setTab('manual')}
          >
            <List size={14} /> Manual Selection
          </button>
        </div>

        {/* ── VIN Input Panel ── */}
        {tab === 'vin' && (
          <div className={`card ${styles.scannerCard}`}>
            <div className={styles.scannerHeader}>
              <h2 className={styles.scannerTitle}>Vehicle Identification Number</h2>
              <p className={styles.scannerSub}>
                The VIN is a 17-character code printed on the dashboard (driver's side) and door jamb
              </p>
            </div>
            {/* Remount when the URL VIN changes so the input tracks it */}
            <VINScanner
              key={urlVin || ''}
              onDecode={handleDecode}
              loading={loading}
              error={error}
              initialVin={urlVin || ''}
            />
          </div>
        )}

        {/* ── Manual Selection Panel ── */}
        {tab === 'manual' && (
          <div className={`card ${styles.scannerCard}`}>
            <div className={styles.scannerHeader}>
              <h2 className={styles.scannerTitle}>Select Your Vehicle</h2>
              <p className={styles.scannerSub}>
                Don't have a VIN? Browse by make, model, and year
              </p>
            </div>
            <div className={styles.manualGrid}>
              <div>
                <label className={styles.label}>Make</label>
                <div className={styles.selectWrapper}>
                  <select
                    className="input"
                    value={selectedMake}
                    onChange={e => handleMakeChange(e.target.value)}
                    disabled={loadingMakes || makesError}
                  >
                    <option value="">
                      {loadingMakes ? 'Loading makes…' : makesError ? 'Makes unavailable' : 'Select Make…'}
                    </option>
                    {makes.map(m => (
                      <option key={m.make_id} value={m.make_name}>{m.make_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={styles.selectChevron} />
                </div>
              </div>
              <div>
                <label className={styles.label}>Year</label>
                <div className={styles.selectWrapper}>
                  <select
                    className="input"
                    value={selectedYear}
                    onChange={e => handleYearChange(e.target.value)}
                  >
                    <option value="">Any Year</option>
                    {years.slice(0, 30).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={styles.selectChevron} />
                </div>
              </div>
              <div>
                <label className={styles.label}>Model</label>
                <div className={styles.selectWrapper}>
                  <select
                    className="input"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    disabled={!selectedMake || loadingModels}
                  >
                    <option value="">
                      {loadingModels
                        ? 'Loading…'
                        : !selectedMake
                          ? 'Select Make first'
                          : models.length === 0
                            ? 'No models found'
                            : 'Select Model…'}
                    </option>
                    {models.map(m => (
                      <option key={m.model_id} value={m.model_name}>{m.model_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={styles.selectChevron} />
                </div>
              </div>
            </div>
            <div className={styles.manualCTA}>
              <button
                className="btn btn-primary"
                disabled={!canBrowseParts}
                onClick={handleManualSearch}
              >
                {isUncataloguedMake
                  ? `Parts catalog for ${selectedMake} coming soon`
                  : `Browse Parts for ${selectedYear} ${selectedMake} ${selectedModel}`}
              </button>
              <span className={styles.manualNote}>
                {isUncataloguedMake
                  ? `${selectedMake} isn't in the parts catalog yet — coming in Phase 2`
                  : 'Full manual lookup available in Phase 2'}
              </span>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div className={styles.result}>
            <VehicleCard result={result} catalogBrands={catalogBrands} />
          </div>
        )}

        {/* ── How VINs Work ── */}
        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>How VINs work</h3>
          <div className={styles.infoGrid}>
            {[
              { pos: '1–3', name: 'WMI', desc: 'World Manufacturer Identifier — country and maker', color: 'amber' },
              { pos: '4–9', name: 'VDS', desc: 'Vehicle Descriptor Section — model, body, engine', color: 'ice' },
              { pos: '10–17', name: 'VIS', desc: 'Vehicle Identifier Section — year, plant, serial', color: 'success' },
            ].map(s => (
              <div key={s.pos} className={`card ${styles.infoCard}`}>
                <div className={`${styles.infoPos} ${styles[`pos_${s.color}`]}`}>
                  Positions {s.pos}
                </div>
                <h4 className={styles.infoName}>{s.name}</h4>
                <p className={styles.infoDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
