import { useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Today from "./components/Today";
import Medicines from "./components/Medicines";
import History from "./components/History";
import Statistics from "./components/Statistics";
import "./components/Today.css";
import { initDB } from './services/storage';
import { LanguageProvider, useLang } from './i18n';

function AppInner() {
  const { t, lang, toggleLang } = useLang();

  useEffect(() => {
    initDB().catch(err => console.error(err));
  }, []);

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <button className="lang-toggle" onClick={toggleLang}>{lang === "en" ? "🇮🇹" : "🇬🇧"}</button>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/history" element={<History />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>

      <nav className="nav-bar">
        <NavLink to="/" end>📅<span>{t.nav.today}</span></NavLink>
        <NavLink to="/medicines">🌿<span>{t.nav.medicines}</span></NavLink>
        <NavLink to="/history">📋<span>{t.nav.history}</span></NavLink>
        <NavLink to="/statistics">📊<span>{t.nav.statistics}</span></NavLink>
      </nav>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
