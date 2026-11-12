import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Wrench, BookOpen, Cpu, Menu, X } from 'lucide-react';
import { useState } from 'react';
import styles from './Layout.module.css';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickVin, setQuickVin] = useState('');
  const navigate = useNavigate();

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickVin.trim().length === 17) {
      navigate(`/vin?vin=${quickVin.trim().toUpperCase()}`);
      setQuickVin('');
      setMenuOpen(false);
    } else if (quickVin.trim().length > 0) {
      navigate(`/catalog?q=${encodeURIComponent(quickVin.trim())}`);
      setQuickVin('');
      setMenuOpen(false);
    }
  };

  return (
    <div className={styles.app}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <Wrench size={20} className={styles.logoIcon} />
            <span className={styles.logoText}>
              Auto<span className={styles.logoAccent}>Parts</span>
            </span>
            <span className={styles.logoBeta}>BETA</span>
          </Link>

          {/* Quick search */}
          <form onSubmit={handleQuickSearch} className={styles.headerSearch}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="VIN or search model..."
              value={quickVin}
              onChange={e => setQuickVin(e.target.value)}
              maxLength={17}
            />
          </form>

          {/* Nav */}
          <nav className={styles.nav}>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navActive : ''}`
              }
              end
            >
              <Cpu size={15} />
              Home
            </NavLink>
            <NavLink
              to="/vin"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navActive : ''}`
              }
            >
              <Search size={15} />
              VIN Decoder
            </NavLink>
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navActive : ''}`
              }
            >
              <BookOpen size={15} />
              Catalog
            </NavLink>
          </nav>

          {/* Mobile menu toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/vin" onClick={() => setMenuOpen(false)}>VIN Decoder</NavLink>
            <NavLink to="/catalog" onClick={() => setMenuOpen(false)}>Catalog</NavLink>
            <form onSubmit={handleQuickSearch} className={styles.mobileSearch}>
              <input
                className="input"
                placeholder="Search VIN or model..."
                value={quickVin}
                onChange={e => setQuickVin(e.target.value)}
              />
            </form>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span className={styles.footerLogo}>
            <Wrench size={14} />
            AutoParts
          </span>
          <span className={styles.footerText}>
            Proprietary automotive parts catalog — built with React + NHTSA API
          </span>
          <div className={styles.footerLinks}>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://github.com/len-golani/AutoParts" target="_blank" rel="noreferrer">Source</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
