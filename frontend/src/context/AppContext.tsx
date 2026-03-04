import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { getCountries, type CountryItem } from '../api/countries'

export type Locale = 'zh' | 'en'

interface AppContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  toggleLocale: () => void
  countries: CountryItem[]
  countryId: string | null
  setCountry: (id: string | null) => void
  refreshCountries: () => Promise<void>
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
    'config.sidebar.collapse': '收起侧边栏',
    'config.sidebar.expand': '展开侧边栏',
    'industry.placeholder': '行业资讯内容将在此展示',
    'sales.placeholder': '销量分析内容将在此展示',
    'country.add': '+ 新增',
    'country.nameZh': '中文名称',
    'country.nameEn': '英文名称',
    'country.save': '保存',
    'country.cancel': '取消',
    'model.addNew': '+ 新增',
    'model.addModel': '新增车型',
    'model.brandName': '品牌名称',
    'model.name': '车型名称',
    'model.year': '年款',
    'model.upload': '上传文件',
    'model.uploadHint': '将按所示顺序排列并合成一个 PDF，再进一步处理。可拖动调整顺序，点击预览。',
    'model.preview': '预览',
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
    'config.sidebar.collapse': 'Collapse sidebar',
    'config.sidebar.expand': 'Expand sidebar',
    'industry.placeholder': 'Industry news will be displayed here',
    'sales.placeholder': 'Sales analysis will be displayed here',
    'country.add': '+ Add new',
    'country.nameZh': 'Name (Chinese)',
    'country.nameEn': 'Name (English)',
    'country.save': 'Save',
    'country.cancel': 'Cancel',
    'model.addNew': '+ Add new',
    'model.addModel': 'Add model',
    'model.brandName': 'Brand name',
    'model.name': 'Model name',
    'model.year': 'Model year',
    'model.upload': 'Upload files',
    'model.uploadHint': 'Files will be merged in the order shown into one PDF for further processing. Drag to reorder, click to preview.',
    'model.preview': 'Preview',
  },
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')
  const [countries, setCountries] = useState<CountryItem[]>([])
  const [countryId, setCountryId] = useState<string | null>(null)

  const refreshCountries = useCallback(async () => {
    const list = await getCountries(locale)
    setCountries(list)
    setCountryId((prev) => {
      if (prev === null && list.length > 0) return list[0].id
      if (prev !== null && !list.some((c) => c.id === prev)) return list[0]?.id ?? null
      return prev
    })
  }, [locale])

  useEffect(() => {
    refreshCountries()
  }, [refreshCountries])

  const setCountry = useCallback((id: string | null) => {
    setCountryId(id)
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
    locale,
    setLocale,
    toggleLocale,
    countries,
    countryId,
    setCountry,
    refreshCountries,
    t,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
