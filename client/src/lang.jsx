import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { translator } from "./i18n.js";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  const t = useMemo(() => translator(lang), [lang]);
  const toggle = useCallback(() => setLang((l) => (l === "en" ? "hi" : "en")), []);
  return <LangContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
