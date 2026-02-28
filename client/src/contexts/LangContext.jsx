import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from '../i18n/translations';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ko');

  const changeLang = useCallback((l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback(
    (key) => (translations[lang] && translations[lang][key]) || key,
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
