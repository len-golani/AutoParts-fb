import { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import styles from './VINScanner.module.css';

interface VINScannerProps {
  onDecode: (vin: string) => void;
  loading: boolean;
  error: string | null;
  initialVin?: string;
}

// Sample VINs for the placeholder hint
const SAMPLE_VINS = [
  '4T1BF3EK8AU561547', // Toyota
  '1FTFW1ET5DFC43861', // Ford
  '2HGFC2F59JH531528', // Honda
  'WBAVB13516PT18676', // BMW
  '1VWFE21C04M000001', // VW
];

export default function VINScanner({ onDecode, loading, error, initialVin = '' }: VINScannerProps) {
  const [vin, setVin] = useState(initialVin);
  const [scanning, setScanning] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);
  const [hintIndex, setHintIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate hint VINs
  useEffect(() => {
    const t = setInterval(() => {
      setHintIndex(i => (i + 1) % SAMPLE_VINS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Keep the latest decode callback without restarting the scan timer
  const onDecodeRef = useRef(onDecode);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  // Scan animation on submit
  useEffect(() => {
    if (!scanning || vin.length !== 17) return;

    let index = -1;
    const interval = setInterval(() => {
      index += 1;
      if (index >= 17) {
        clearInterval(interval);
        setScanIndex(-1);
        setScanning(false);
        onDecodeRef.current(vin.toUpperCase());
      } else {
        setScanIndex(index);
      }
    }, 55);

    return () => clearInterval(interval);
  }, [scanning, vin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = vin.trim().toUpperCase();
    if (clean.length === 17) {
      setScanIndex(0);
      setScanning(true);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    setVin(val.slice(0, 17));
  };

  const useSample = () => {
    setVin(SAMPLE_VINS[hintIndex]);
    inputRef.current?.focus();
  };

  const isValid = vin.length === 17;
  const isActive = loading || scanning;

  return (
    <div className={styles.wrapper}>
      {/* VIN Structure Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem} title="World Manufacturer Identifier">
          <span className={styles.legendBracket}>[</span>
          <span className={`${styles.legendLabel} ${styles.wmi}`}>WMI</span>
          <span className={styles.legendBracket}>]</span>
        </span>
        <span className={styles.legendItem} title="Vehicle Descriptor Section">
          <span className={styles.legendBracket}>[</span>
          <span className={`${styles.legendLabel} ${styles.vds}`}>VDS</span>
          <span className={styles.legendBracket}>]</span>
        </span>
        <span className={styles.legendItem} title="Vehicle Identifier Section">
          <span className={styles.legendBracket}>[</span>
          <span className={`${styles.legendLabel} ${styles.vis}`}>VIS</span>
          <span className={styles.legendBracket}>]</span>
        </span>
      </div>

      {/* VIN Display (character breakdown) */}
      <div className={styles.vinDisplay}>
        {Array.from({ length: 17 }).map((_, i) => {
          const char = vin[i] || '';
          const isScanned = scanIndex >= 0 && i <= scanIndex;
          const isScanning = scanIndex === i;
          const isWMI = i < 3;
          const isVDS = i >= 3 && i < 9;

          return (
            <div
              key={i}
              className={`
                ${styles.vinChar}
                ${isWMI ? styles.wmiChar : ''}
                ${isVDS ? styles.vdsChar : styles.visChar}
                ${isScanned ? styles.scanned : ''}
                ${isScanning ? styles.scanning : ''}
                ${char ? styles.filled : ''}
              `}
            >
              <span className={styles.charValue}>{char || '·'}</span>
              <span className={styles.charIndex}>{i + 1}</span>
            </div>
          );
        })}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <Search size={18} className={styles.inputIcon} />
          <input
            ref={inputRef}
            type="text"
            className={`${styles.vinInput} ${error ? styles.vinInputError : ''} ${isValid ? styles.vinInputValid : ''}`}
            aria-label="Vehicle Identification Number (VIN)"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'vin-error' : undefined}
            value={vin}
            onChange={handleInput}
            placeholder={`Try: ${SAMPLE_VINS[hintIndex]}`}
            disabled={isActive}
            maxLength={17}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
          />
          <span className={styles.charCount}>
            <span className={vin.length === 17 ? styles.countDone : ''}>{vin.length}</span>/17
          </span>
        </div>

        <button
          type="submit"
          className={`btn btn-primary ${styles.decodeBtn}`}
          disabled={!isValid || isActive}
        >
          {isActive ? (
            <>
              <Loader2 size={16} className={styles.spin} />
              {scanning ? 'Scanning…' : 'Decoding…'}
            </>
          ) : (
            <>
              <Search size={16} />
              Decode VIN
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && !isActive && (
        <div id="vin-error" role="alert" className={styles.error}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Sample VIN helper */}
      {!vin && (
        <div className={styles.hint}>
          <span className={styles.hintText}>No VIN? Try a sample:</span>
          <button onClick={useSample} className={styles.hintBtn}>
            {SAMPLE_VINS[hintIndex]}
          </button>
        </div>
      )}
    </div>
  );
}
