import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type Locale = 'zh' | 'en'

const COUNTRIES = [
  { code: 'CN', nameZh: '中国', nameEn: 'China' },
  { code: 'US', nameZh: '美国', nameEn: 'USA' },
  { code: 'DE', nameZh: '德国', nameEn: 'Germany' },
  { code: 'JP', nameZh: '日本', nameEn: 'Japan' },
  { code: 'NL', nameZh: '荷兰', nameEn: 'Netherlands' },
] as const

type CountryCode = (typeof COUNTRIES)[number]['code']

interface AppState {
  country: CountryCode
  locale: Locale
}

interface AppContextValue extends AppState {
  setCountry: (code: CountryCode) => void
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  countries: typeof COUNTRIES
  t: (key: string) => string
}

const translations: Record<Locale, Record<string, string>> = {
  zh: {
    'tab.industry': '行业资讯',
    'tab.config': '配置定价',
    'tab.sales': '销量分析',
    'lang.zh': '中文',
    'lang.en': 'English',
    'user.entry': '用户管理',
    'config.search.placeholder': '搜索车型...',
    'config.content.title': '配置与定价',
    'config.content.placeholder': '在此查看车型配置与定价信息',
    'industry.placeholder': '行业资讯内容将在此展示',
    'sales.placeholder': '销量分析内容将在此展示',
  },
  en: {
    'tab.industry': 'Industry News',
    'tab.config': 'Config & Pricing',
    'tab.sales': 'Sales Analysis',
    'lang.zh': '中文',
    'lang.en': 'English',
    'user.entry': 'User Management',
    'config.search.placeholder': 'Search vehicle model...',
    'config.content.title': 'Config & Pricing',
    'config.content.placeholder': 'View vehicle config and pricing here',
    'industry.placeholder': 'Industry news will be displayed here',
    'sales.placeholder': 'Sales analysis will be displayed here',
  },
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<CountryCode>('CN')
  const [locale, setLocaleState] = useState<Locale>('zh')

  const setCountry = useCallback((code: CountryCode) => {
    setCountryState(code)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'zh' ? 'en' : 'zh'))
  }, [])

  const t = useCallback(
    (key: string) => translations[locale][key] ?? key,
    [locale]
  )

  const value: AppContextValue = {
    country,
    locale,
    setCountry,
    setLocale,
    toggleLocale,
    countries: COUNTRIES,
    t,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
