"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  DEFAULT_LANGUAGE,
  translations,
  type Language,
  type TranslationKey
} from "@/lib/i18n/dictionary";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "orbit-nexus-language";

function isLanguage(value: string | null): value is Language {
  return value === "es" || value === "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);

    if (isLanguage(storedLanguage)) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        window.localStorage.setItem(STORAGE_KEY, nextLanguage);
        document.documentElement.lang = nextLanguage;
      },
      t(key) {
        return translations[language][key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
      }
    }),
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
