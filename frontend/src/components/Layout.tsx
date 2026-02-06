import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { GlobeIcon, LanguageIcon, UserIcon } from './Icons'

interface LayoutProps {
  children: ReactNode
}

const tabPaths = [
  { path: '/industry-news', key: 'tab.industry' },
  { path: '/config-pricing', key: 'tab.config' },
  { path: '/sales-analysis', key: 'tab.sales' },
] as const

export function Layout({ children }: LayoutProps) {
  const { country, setCountry, countries, locale, toggleLocale, t } = useApp()

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* 全宽顶部导航栏 */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
          {/* 左侧：Logo + 国家选择 + Tabs */}
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <img src="/saic-logo.svg" alt="上汽集团" className="h-9 w-auto shrink-0" width="36" height="36" />
            <div className="flex items-center gap-2">
              <GlobeIcon size={18} className="text-slate-500" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as typeof country)}
                className="border-0 bg-transparent py-2 pr-6 text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {locale === 'zh' ? c.nameZh : c.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <nav className="flex gap-0.5" aria-label="Main tabs">
              {tabPaths.map(({ path, key }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {t(key)}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* 右侧：语言切换 + 用户管理 */}
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={toggleLocale}
              className="flex items-center gap-2 border-0 bg-transparent py-2 text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none"
            >
              <LanguageIcon size={18} />
              {locale === 'zh' ? t('lang.en') : t('lang.zh')}
            </button>
            <a
              href="/user"
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 focus:outline-none"
              aria-label={t('user.entry')}
            >
              <UserIcon size={20} />
              <span className="hidden text-sm font-medium sm:inline">{t('user.entry')}</span>
            </a>
          </div>
        </div>
      </header>

      {/* 全宽主内容区，无最大宽度限制 */}
      <main className="w-full px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
