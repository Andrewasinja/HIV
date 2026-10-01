import { createContext, useContext, useEffect, useState } from 'react'
import en from './en.json'
import lg from './lg.json'

const DICTS = { en, lg }
const STORAGE_KEY = 'hiv_lang'

const LanguageContext = createContext(null)

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  // Returns strings with {placeholders} filled, or raw arrays/objects as-is.
  const t = (key, vars) => {
    const value = lookup(DICTS[lang], key) ?? lookup(en, key) ?? key
    if (typeof value !== 'string' || !vars) return value
    return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '')
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext)
