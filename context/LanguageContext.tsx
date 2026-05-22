import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, getTranslations, LANGUAGES } from '@/lib/i18n';

type LanguageContextType = {
  language: Language;
  isEnglishMode: boolean;
  displayLanguage: Language;
  setLanguage: (lang: Language) => void;
  toggleEnglishMode: () => void;
  t: ReturnType<typeof getTranslations>;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  isEnglishMode: false,
  displayLanguage: 'en',
  setLanguage: () => {},
  toggleEnglishMode: () => {},
  t: getTranslations('en'),
});

const LANG_KEY = 'hcw_language';
const ENGLISH_MODE_KEY = 'hcw_english_mode';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('en');
  const [isEnglishMode, setIsEnglishMode] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([LANG_KEY, ENGLISH_MODE_KEY])
      .then(([[, lang], [, englishMode]]) => {
        const validCodes = LANGUAGES.map(l => l.code);
        if (lang && validCodes.includes(lang as Language)) setLangState(lang as Language);
        if (englishMode) setIsEnglishMode(englishMode === 'true');
      })
      .catch(() => {});
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    AsyncStorage.setItem(LANG_KEY, lang).catch(() => {});
  };

  const toggleEnglishMode = () => {
    const next = !isEnglishMode;
    setIsEnglishMode(next);
    AsyncStorage.setItem(ENGLISH_MODE_KEY, String(next)).catch(() => {});
  };

  const displayLanguage: Language = isEnglishMode ? 'en' : language;
  const t = getTranslations(displayLanguage);

  return (
    <LanguageContext.Provider
      value={{ language, isEnglishMode, displayLanguage, setLanguage, toggleEnglishMode, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
