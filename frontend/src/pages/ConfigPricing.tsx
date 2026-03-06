import { useApp } from '../context/AppContext'

/** 配置定价主内容区：列表占位（左侧栏由 ConfigPricingLayout 提供） */
export function ConfigPricing() {
  const { t } = useApp()
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-800">
        {t('config.content.title')}
      </h2>
      <p className="mt-4 text-slate-500">{t('config.content.placeholder')}</p>
    </>
  )
}
