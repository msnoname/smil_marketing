import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, useBlocker } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { createModel, updateModel, suggestBrands, getModel } from '../api/models'
import { ConfigTableProcessingModal } from '../components/ConfigTableProcessingModal'

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** 从完整车型名中提取品牌后的可编辑部分 */
function deriveModelPart(model: string, brand: string): string {
  if (!brand) return model
  if (model.toLowerCase().startsWith(brand.toLowerCase())) {
    return model.slice(brand.length).trim()
  }
  return model
}

/** 判断是否有未保存的更改 */
function hasUnsavedChanges(
  brand: string,
  modelPart: string,
  modelYear: string,
  isEditMode: boolean,
  initialBrand?: string,
  initialModelPart?: string,
  initialModelYear?: string
): boolean {
  if (isEditMode && initialBrand !== undefined) {
    const fullModel = `${brand} ${modelPart}`.trim()
    const initialFull = `${initialBrand} ${initialModelPart ?? ''}`.trim()
    return (
      brand.trim() !== initialBrand.trim() ||
      fullModel !== initialFull ||
      modelYear.trim() !== (initialModelYear ?? '').trim()
    )
  }
  return brand.trim() !== '' || modelPart.trim() !== '' || modelYear.trim() !== ''
}

export function ModelEdit() {
  const { t, countryId, locale } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as {
    searchQuery?: string
    modelId?: string
    brand?: string
    model?: string
    model_year?: number | null
    openProcessingModal?: boolean
  } | undefined

  const isEditMode = Boolean(locationState?.modelId)
  const editModelId = locationState?.modelId
  const editBrand = locationState?.brand ?? ''
  const editModel = locationState?.model ?? ''
  const editModelYear = locationState?.model_year
  const initialSearch = locationState?.searchQuery ?? ''

  // 编辑模式：从 location.state 直接初始化（brand/model/model_year 来自数据库）
  const [brand, setBrand] = useState(() =>
    isEditMode && editBrand ? editBrand : ''
  )
  const [modelPart, setModelPart] = useState(() =>
    isEditMode && editBrand && editModel ? deriveModelPart(editModel, editBrand) : ''
  )
  const [modelYear, setModelYear] = useState(() =>
    isEditMode && editModelYear != null ? String(editModelYear) : ''
  )
  const [saving, setSaving] = useState(false)
  const [createdModelId, setCreatedModelId] = useState<string | null>(null)
  const [modelUrls, setModelUrls] = useState<{
    original_url?: string | null
    cn_url?: string | null
    en_url?: string | null
  }>({})
  const [processingModalOpen, setProcessingModalOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState<'original' | 'cn' | 'en'>('original')
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cancel' | 'blocker' | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hasInitializedAdd = useRef(false)
  /** 用户已确认离开，此时 goBack() 不应再被 blocker 拦截 */
  const userConfirmedLeaveRef = useRef(false)

  // 新增模式：从搜索关键词预填品牌/车型（需异步获取品牌建议）
  useEffect(() => {
    if (isEditMode) return
    if (!initialSearch || hasInitializedAdd.current) return
    hasInitializedAdd.current = true
    const trimmed = initialSearch.trim()
    const parts = trimmed.split(/\s+/).filter(Boolean)
    const brandInput = parts[0] ?? ''
    const modelPartInput = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? ''
    let initialBrand = capitalize(brandInput)
    let initialModelPart = capitalize(modelPartInput)
    const applySuggest = async () => {
      if (countryId && brandInput) {
        try {
          const matches = await suggestBrands(countryId, brandInput)
          if (matches.length > 0) {
            const first = matches[0]
            const closeMatch =
              first.toLowerCase() === brandInput.toLowerCase() ||
              first.toLowerCase().includes(brandInput.toLowerCase()) ||
              brandInput.toLowerCase().includes(first.toLowerCase())
            if (closeMatch) initialBrand = capitalize(first)
          }
        } catch {
          // keep initialBrand as capitalize(brandInput)
        }
      }
      setBrand(initialBrand)
      setModelPart(initialModelPart)
    }
    applySuggest()
  }, [isEditMode, initialSearch, countryId])

  const currentModelId = editModelId ?? createdModelId
  const hasOriginalUrl = Boolean(modelUrls.original_url)

  useEffect(() => {
    if (!currentModelId) return
    getModel(currentModelId)
      .then((m) => setModelUrls({ original_url: m.original_url, cn_url: m.cn_url, en_url: m.en_url }))
      .catch(() => setModelUrls({}))
  }, [currentModelId])

  // 新建车型后 navigate 会 remount（key 变化），通过 state 恢复“打开上传弹窗”的意图
  useEffect(() => {
    if (locationState?.openProcessingModal && currentModelId) {
      setProcessingModalOpen(true)
      const { openProcessingModal: _, ...rest } = locationState
      navigate(location.pathname, { replace: true, state: rest })
    }
  }, [locationState?.openProcessingModal, currentModelId, location.pathname, locationState, navigate])

  const initialModelPartForDirty = isEditMode ? deriveModelPart(editModel, editBrand) : undefined
  const isDirty = hasUnsavedChanges(
    brand,
    modelPart,
    modelYear,
    isEditMode,
    editBrand,
    initialModelPartForDirty,
    editModelYear != null ? String(editModelYear) : ''
  )

  const goBack = useCallback(() => {
    navigate('/config-pricing', { replace: true })
  }, [navigate])

  const handleCancel = () => {
    if (!isDirty) {
      goBack()
      return
    }
    setPendingAction('cancel')
    setLeaveConfirmOpen(true)
  }

  const handleLeaveConfirm = () => {
    setLeaveConfirmOpen(false)
    userConfirmedLeaveRef.current = true // 用户已确认，goBack 不再被 blocker 拦截
    if (pendingAction === 'cancel') {
      goBack()
    } else if (pendingAction === 'blocker' && blocker.state === 'blocked') {
      blocker.proceed?.()
    }
    setPendingAction(null)
  }

  const handleStay = () => {
    setLeaveConfirmOpen(false)
    if (pendingAction === 'blocker' && blocker.state === 'blocked') {
      blocker.reset?.()
    }
    setPendingAction(null)
  }

  const handleOpenProcessingModal = async () => {
    if (!countryId) return
    const fullModel = `${brand} ${modelPart}`.trim()
    if (!fullModel || !brand.trim()) return

    let modelIdToUse = currentModelId
    if (!modelIdToUse) {
      setSaving(true)
      try {
        const yearNum = modelYear.trim() ? parseInt(modelYear.trim(), 10) : null
        const modelYearVal = yearNum != null && !Number.isNaN(yearNum) ? yearNum : null
        const created = await createModel({
          country_id: countryId,
          brand: brand.trim(),
          model: fullModel,
          model_year: modelYearVal,
        })
        modelIdToUse = created.id
        setCreatedModelId(created.id)
        navigate(`/config-pricing/edit`, {
          replace: true,
          state: {
            modelId: created.id,
            brand: brand.trim(),
            model: fullModel,
            model_year: modelYearVal,
            openProcessingModal: true,
          },
        })
      } finally {
        setSaving(false)
      }
    }
    if (modelIdToUse) setProcessingModalOpen(true)
  }

  const handleProcessingSaved = (result: { original_url: string }) => {
    const sep = result.original_url.includes('?') ? '&' : '?'
    const cacheBusted = result.original_url + sep + 'v=' + Date.now()
    setModelUrls((prev) => ({
      ...prev,
      original_url: cacheBusted,
      cn_url: null,
      en_url: null,
    }))
  }

  const handleSave = async () => {
    const fullModel = `${brand} ${modelPart}`.trim()
    if (!fullModel || !brand.trim() || !countryId) return
    const yearNum = modelYear.trim() ? parseInt(modelYear.trim(), 10) : null
    const modelYearVal = yearNum != null && !Number.isNaN(yearNum) ? yearNum : null

    setSaveError(null)
    const modelIdToSave = currentModelId ?? editModelId
    if (modelIdToSave) {
      setSaving(true)
      try {
        await updateModel(modelIdToSave, {
          brand: brand.trim(),
          model: fullModel,
          model_year: modelYearVal,
        })
        navigate('/config-pricing', { state: { searchQuery: fullModel }, replace: true })
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : '保存失败')
      } finally {
        setSaving(false)
      }
    } else {
      setSaving(true)
      try {
        const created = await createModel({
          country_id: countryId,
          brand: brand.trim(),
          model: fullModel,
          model_year: modelYearVal,
        })
        setCreatedModelId(created.id)
        navigate(`/config-pricing/edit`, {
          replace: true,
          state: {
            modelId: created.id,
            brand: brand.trim(),
            model: fullModel,
            model_year: modelYearVal,
          },
        })
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : '保存失败')
      } finally {
        setSaving(false)
      }
    }
  }

  // 离开前未保存提示：beforeunload（关闭标签页、刷新等）
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !saving) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, saving])

  // 离开前未保存提示：React Router 导航（点击其他 Tab、浏览器后退等）
  // 当用户已在弹窗中确认「离开」时不再拦截，否则 goBack() 会被 block 导致需点两次
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !userConfirmedLeaveRef.current &&
      isDirty &&
      !saving &&
      currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setPendingAction('blocker')
      setLeaveConfirmOpen(true)
    }
  }, [blocker.state])

  if (!countryId) {
    return (
      <div className="w-full">
        <p className="text-slate-500">{locale === 'zh' ? '请先选择国家' : 'Please select a country first'}</p>
        <button
          type="button"
          onClick={goBack}
          className="mt-4 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('country.cancel')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 w-full flex-col">
      {/* 上边：标题 */}
      <h2 className="shrink-0 text-lg font-semibold text-slate-800">
        {t('model.editTitle')}
      </h2>

      {/* 品牌名称、车型名称、年款 排成一横行 */}
      <div className="mt-4 grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-600">
            {t('model.brandName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setSaveError(null) }}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={t('model.brandName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            {t('model.name')} <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm focus-within:border-slate-300 focus-within:outline-none focus-within:ring-0">
            <span className="shrink-0 text-slate-500">{brand || ' '}</span>
            <input
              type="text"
              value={modelPart}
              onChange={(e) => { setModelPart(e.target.value); setSaveError(null) }}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none focus:ring-0"
              placeholder={t('model.name')}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{t('model.nameHint')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">
            {t('model.year')} <span className="text-slate-400">({t('model.yearOptional')})</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={modelYear}
            onChange={(e) => { setModelYear(e.target.value); setSaveError(null) }}
            placeholder="e.g. 2026"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 下半部分：左右两板块，宽度平分 */}
      <div className="mt-6 flex min-h-0 flex-1 gap-4">
        {/* 左侧：上传文件 */}
        <div className="min-h-[200px] min-w-0 flex-1 rounded border border-slate-200 bg-slate-50/30 p-4">
          <h3 className="text-sm font-medium text-slate-600">{t('model.upload')}</h3>
          {!hasOriginalUrl ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleOpenProcessingModal}
                disabled={saving || !brand.trim() || !modelPart.trim()}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t('configProcessing.upload')}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex gap-1 border-b border-slate-200">
                {[
                  { key: 'original' as const, label: t('configProcessing.tabOriginal'), url: modelUrls.original_url },
                  { key: 'cn' as const, label: t('configProcessing.tabCn'), url: modelUrls.cn_url },
                  { key: 'en' as const, label: t('configProcessing.tabEn'), url: modelUrls.en_url },
                ].map(({ key, label, url }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => url && setPreviewTab(key)}
                    disabled={!url}
                    className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                      previewTab === key
                        ? 'border-blue-600 text-blue-600'
                        : url
                          ? 'border-transparent text-slate-600 hover:text-slate-900'
                          : 'border-transparent text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 min-h-[200px] rounded border border-slate-200 bg-white">
                {previewTab === 'original' && modelUrls.original_url && (
                  <iframe
                    src={modelUrls.original_url}
                    title="Original"
                    className="h-[300px] w-full rounded"
                  />
                )}
                {previewTab === 'cn' && modelUrls.cn_url && (
                  <iframe
                    src={modelUrls.cn_url}
                    title="Chinese"
                    className="h-[300px] w-full rounded"
                  />
                )}
                {previewTab === 'en' && modelUrls.en_url && (
                  <iframe
                    src={modelUrls.en_url}
                    title="English"
                    className="h-[300px] w-full rounded"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleOpenProcessingModal}
                className="mt-2 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('configProcessing.modify')}
              </button>
            </div>
          )}
        </div>

        {/* 右侧：数据库预览 */}
        <div className="min-h-[200px] min-w-0 flex-1 rounded border border-slate-200 bg-slate-50/30 p-4">
          <h3 className="text-sm font-medium text-slate-600">{t('model.dbPreview')}</h3>
          <p className="mt-2 text-xs text-slate-400">{t('common.placeholder')}</p>
        </div>
      </div>

      {/* 右下角：错误提示、取消、保存 */}
      {saveError && (
        <p className="mt-6 text-sm text-red-600">{saveError}</p>
      )}
      <div className="mt-8 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('country.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !brand.trim() || !modelPart.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving
            ? (locale === 'zh' ? '合并上传中...' : 'Merging & uploading...')
            : t('country.save')}
        </button>
      </div>

      {currentModelId && (
        <ConfigTableProcessingModal
          open={processingModalOpen}
          onClose={() => setProcessingModalOpen(false)}
          onSaved={handleProcessingSaved}
          modelId={currentModelId}
        />
      )}

      {/* 未保存离开确认弹窗 */}
      {leaveConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleStay}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800">{t('unsaved.title')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('unsaved.message')}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleStay}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('unsaved.stay')}
              </button>
              <button
                type="button"
                onClick={handleLeaveConfirm}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t('unsaved.leave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
