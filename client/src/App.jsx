import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { BrandMark } from "./ui.jsx";
import { useLang } from "./lang.jsx";
import { useAuth } from "./auth.jsx";
import { LANGS } from "./i18n.js";
import CitizenPortal from "./pages/CitizenPortal.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";
import Console from "./pages/Console.jsx";

function TopBar() {
  const { lang, setLang, t } = useLang();
  const { user, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <NavLink to="/" className="brand" style={{ textDecoration: "none" }}>
        <BrandMark />
        <div>
          <span className="name">Land Stack</span>
          <span className="sub">{t("brandSub")}</span>
        </div>
      </NavLink>

      <nav className="topnav">
        <NavLink to="/" end>
          {t("navExplorer")}
        </NavLink>
        <NavLink to="/verify">{t("navVerify")}</NavLink>
        <NavLink to="/console">{t("navConsole")}</NavLink>
        <a href="/v1/docs" target="_blank" rel="noreferrer">
          {t("navDocs")}
        </a>
      </nav>

      <div style={{ flex: "1 1 auto" }} />

      <div className="controls">
        <span className="pilot-badge">
          <span className="dot" />
          {t("pilot")}
        </span>
        <div className="lang">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={lang === l.code ? "on" : ""}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
        {user ? (
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            {t("signOut")}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate("/console")}>
            {t("signIn")}
          </button>
        )}
        {isStaff ? null : null}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app">
      <TopBar />
      <Routes>
        <Route path="/" element={<CitizenPortal />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/console" element={<Console />} />
      </Routes>
    </div>
  );
}
