import { useApp } from '../context/AppContext'

export function IndustryNews() {
  const { t } = useApp()
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-slate-800">
        {t('tab.industry')}
      </h2>
      <p className="mt-4 text-slate-500">{t('industry.placeholder')}</p>
    </div>
  )
}
