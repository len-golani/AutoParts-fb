import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import VINDecoderPage from './pages/VINDecoderPage';
import CatalogPage from './pages/CatalogPage';
import BrandPage from './pages/BrandPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/global.css';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/vin" element={<VINDecoderPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:brandSlug" element={<BrandPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
