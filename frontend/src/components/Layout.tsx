import { useState, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { GlobeIcon, LanguageIcon, UserIcon } from './Icons'
import { AddCountryModal } from './AddCountryModal'

const tabPaths = [
  { path: '/industry-news', key: 'tab.industry' },
  { path: '/config-pricing', key: 'tab.config' },
  { path: '/sales-analysis', key: 'tab.sales' },
] as const

const NEW_OPTION_VALUE = '__new__'

export function Layout() {
  const { countryId, setCountry, countries, locale, toggleLocale, t, refreshCountries } = useApp()
  const location = useLocation()
  const [modalOpen, setModalOpen] = useState(false)
  const [blockCountrySwitchOpen, setBlockCountrySwitchOpen] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  const isOnEditPage = location.pathname === '/config-pricing/edit'

  const handleCountryChange = (value: string) => {
    if (value === NEW_OPTION_VALUE) {
      setModalOpen(true)
      const fallback = countries[0]?.id ?? ''
      if (selectRef.current) selectRef.current.value = String(countryId ?? fallback)
      return
    }
    if (isOnEditPage) {
      setBlockCountrySwitchOpen(true)
      return
    }
    setCountry(value === '' ? null : value)
  }

  const handleModalSaved = () => {
    refreshCountries()
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <img src="/saic-logo.svg" alt="上汽集团" className="h-9 w-auto shrink-0" width="36" height="36" />
            <div className="flex items-center gap-2">
              <GlobeIcon size={18} className="text-slate-500" />
              <select
                ref={selectRef}
                value={countryId ?? ''}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="border-0 bg-transparent py-2 pr-6 text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
              >
                <option value={NEW_OPTION_VALUE}>{t('country.add')}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === 'zh' ? c.country_cn : c.country_en}
                  </option>
                ))}
              </select>
            </div>
            <nav className="flex gap-0.5" aria-label="Main tabs">
              {tabPaths.map(({ path, key }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path !== '/config-pricing'}
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
      <main className="w-full px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <AddCountryModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleModalSaved} />

      {blockCountrySwitchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setBlockCountrySwitchOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800">{t('editPage.blockCountrySwitch.title')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('editPage.blockCountrySwitch.message')}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setBlockCountrySwitchOpen(false)}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t('editPage.blockCountrySwitch.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
