import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, ChevronDown } from 'lucide-react';
import VINScanner from '../components/ui/VINScanner';
import VehicleCard from '../components/ui/VehicleCard';
import { vinApi } from '../services/api';
import type { VINDecodeResult } from '../types';
import styles from './VINDecoderPage.module.css';

// Make/Model/Year manual selector (for users without a VIN)
const POPULAR_MAKES = [
  { id: 448, name: 'Toyota' }, { id: 474, name: 'Honda' },
  { id: 460, name: 'Ford' }, { id: 473, name: 'Chevrolet' },
  { id: 449, name: 'BMW' }, { id: 482, name: 'Mercedes-Benz' },
  { id: 483, name: 'Nissan' }, { id: 457, name: 'Volkswagen' },
  { id: 476, name: 'Hyundai' }, { id: 499, name: 'Kia' },
  { id: 469, name: 'Subaru' }, { id: 467, name: 'Mazda' },
];

export default function VINDecoderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<VINDecodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [tab, setTab] = useState<'vin' | 'manual'>('vin');

  // Manual selector state
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [models, setModels] = useState<{ model_id: number; model_name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);

  const urlVin = searchParams.get('vin');

  // Auto-decode if VIN in URL
  useEffect(() => {
    if (urlVin && urlVin.length === 17) {
      handleDecode(urlVin);
    }
  }, [urlVin]);

  // Load years
  useEffect(() => {
    vinApi.getYears().then(setYears).catch(() => {});
  }, []);

  // Load models when make + year change
  useEffect(() => {
    if (selectedMake) {
      const makeId = POPULAR_MAKES.find(m => m.name === selectedMake)?.id;
      if (!makeId) return;
      setLoadingModels(true);
      vinApi
        .getModels(makeId, selectedYear ? parseInt(selectedYear) : undefined)
        .then(d => setModels(d.models || []))
        .catch(() => setModels([]))
        .finally(() => setLoadingModels(false));
    }
  }, [selectedMake, selectedYear]);

  const handleDecode = async (vin: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await vinApi.decode(vin);
      setResult(data);
      setSearchParams({ vin });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to decode VIN');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (selectedMake && selectedModel) {
      // For Phase 1, navigate to catalog — full lookup in Phase 2
      window.location.href = `/catalog/${selectedMake.toLowerCase()}`;
    }
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
            <VINScanner
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
                    onChange={e => { setSelectedMake(e.target.value); setSelectedModel(''); }}
                  >
                    <option value="">Select Make…</option>
                    {POPULAR_MAKES.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
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
                    onChange={e => setSelectedYear(e.target.value)}
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
                      {loadingModels ? 'Loading…' : selectedMake ? 'Select Model…' : 'Select Make first'}
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
                disabled={!selectedMake || !selectedModel}
                onClick={handleManualSearch}
              >
                Browse Parts for {selectedYear} {selectedMake} {selectedModel}
              </button>
              <span className={styles.manualNote}>Full manual lookup available in Phase 2</span>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div className={styles.result}>
            <VehicleCard result={result} />
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
