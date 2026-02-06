import { useApp } from '../context/AppContext'
import { SearchIcon } from '../components/Icons'

export function ConfigPricing() {
  const { t } = useApp()
  return (
    <div className="flex w-full gap-0">
      {/* 左侧栏：仅搜索框，无卡片样式 */}
      <aside className="w-72 shrink-0 border-r border-slate-200 pr-4">
        <label className="sr-only" htmlFor="vehicle-search">
          {t('config.search.placeholder')}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon size={18} />
          </span>
          <input
            id="vehicle-search"
            type="search"
            placeholder={t('config.search.placeholder')}
            className="w-full border border-slate-300 py-2.5 pl-9 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label={t('config.search.placeholder')}
          />
        </div>
        {/* 后续可在此增加筛选、车型列表等 */}
      </aside>

      {/* 主内容区：无卡片，仅留白与分割 */}
      <div className="min-w-0 flex-1 pl-6">
        <h2 className="text-lg font-semibold text-slate-800">
          {t('config.content.title')}
        </h2>
        <p className="mt-4 text-slate-500">{t('config.content.placeholder')}</p>
      </div>
    </div>
  )
}
