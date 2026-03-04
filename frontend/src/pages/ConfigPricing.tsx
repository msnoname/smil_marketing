import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { searchModels, createModel, suggestBrands, mergeAndUploadModelFiles, type ModelItem } from '../api/models'

type UploadFileItem = { id: string; file: File }

const DEBOUNCE_MS = 300

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function ConfigPricing() {
  const { t, countryId, locale } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<ModelItem[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [brand, setBrand] = useState('')
  const [modelPart, setModelPart] = useState('')
  const [modelYear, setModelYear] = useState('')
  const [uploadFiles, setUploadFiles] = useState<UploadFileItem[]>([])
  const [saving, setSaving] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchResults = useCallback(async () => {
    if (!countryId) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const list = await searchModels(countryId, searchQuery)
      setResults(list)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [countryId, searchQuery])

  useEffect(() => {
    const timer = window.setTimeout(fetchResults, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [fetchResults])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddNew = async () => {
    const trimmed = searchQuery.trim()
    const parts = trimmed.split(/\s+/).filter(Boolean)
    const brandInput = parts[0] ?? ''
    const modelPartInput = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? ''

    let initialBrand = capitalize(brandInput)
    let initialModelPart = capitalize(modelPartInput)

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
    setModelYear('')
    setUploadFiles([])
    setAddModalOpen(true)
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    const next: UploadFileItem[] = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
    }))
    setUploadFiles((prev) => [...prev, ...next])
    e.target.value = ''
  }

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= uploadFiles.length) return
    setUploadFiles((prev) => {
      const arr = [...prev]
      const [removed] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, removed)
      return arr
    })
  }

  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const previewFile = (item: UploadFileItem) => {
    const url = URL.createObjectURL(item.file)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  const handleSaveNewModel = async () => {
    const fullModel = `${brand} ${modelPart}`.trim()
    if (!fullModel || !brand.trim() || !countryId) return
    if (uploadFiles.length === 0) return
    setSaving(true)
    try {
      const yearNum = modelYear.trim() ? parseInt(modelYear.trim(), 10) : null
      const created = await createModel({
        country_id: countryId,
        brand: brand.trim(),
        model: fullModel,
        model_year: yearNum != null && !Number.isNaN(yearNum) ? yearNum : null,
      })
      await mergeAndUploadModelFiles(
        created.id,
        uploadFiles.map((item) => item.file)
      )
      setAddModalOpen(false)
      setBrand('')
      setModelPart('')
      setModelYear('')
      setUploadFiles([])
      setSearchQuery(fullModel)
      await fetchResults()
    } finally {
      setSaving(false)
    }
  }

  const showDropdown = dropdownOpen && countryId && searchQuery.trim().length > 0

  return (
    <div className="flex w-full gap-0">
      <aside
        className={`flex shrink-0 flex-col border-r border-slate-200 transition-[width] duration-200 ${
          sidebarOpen ? 'w-72' : 'w-12'
        }`}
      >
        <div className="flex flex-col gap-2 pr-2">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div ref={wrapperRef} className="relative min-w-0 flex-1">
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder={t('config.search.placeholder')}
                      className="w-full border border-slate-300 py-2.5 pl-9 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label={t('config.search.placeholder')}
                      autoComplete="off"
                    />
                  </div>
                  {showDropdown && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={handleAddNew}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-blue-600 hover:bg-slate-50"
                      >
                        {t('model.addNew')}
                      </button>
                      {loading ? (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          {locale === 'zh' ? '加载中...' : 'Loading...'}
                        </div>
                      ) : (
                        results.map((item) => (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedModelId === item.id}
                              onChange={() =>
                                setSelectedModelId((prev) =>
                                  prev === item.id ? null : item.id
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate" title={item.model}>{item.model}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="shrink-0 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={t('config.sidebar.collapse')}
                >
                  <ChevronLeftIcon size={20} />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex w-full justify-center rounded py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label={t('config.sidebar.expand')}
            >
              <ChevronRightIcon size={20} />
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1 pl-6">
        <h2 className="text-lg font-semibold text-slate-800">
          {t('config.content.title')}
        </h2>
        <p className="mt-4 text-slate-500">{t('config.content.placeholder')}</p>
      </div>

      {/* 新增车型弹窗：第一行品牌名称，第二行车型名称（灰字品牌 + 可编辑后半段） */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !saving && setAddModalOpen(false)}
        >
          <div
            className="w-full max-w-sm max-h-[90vh] flex flex-col rounded-lg border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="shrink-0 p-6 pb-0 text-lg font-semibold text-slate-800">
              {t('model.addModel')}
            </h3>
            <div className="mt-4 space-y-4 overflow-y-auto px-6 py-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  {t('model.brandName')}
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={t('model.brandName')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  {t('model.name')}
                </label>
                <div className="mt-1 flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm focus-within:border-slate-300 focus-within:outline-none focus-within:ring-0">
                  <span className="shrink-0 text-slate-500">{brand || ' '}</span>
                  <input
                    type="text"
                    value={modelPart}
                    onChange={(e) => setModelPart(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none focus:ring-0"
                    placeholder={t('model.name')}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {locale === 'zh' ? '前半段为品牌（与上方同步），后半段可编辑' : 'First part = brand (synced above), second part editable'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  {t('model.year')} <span className="text-slate-400">({locale === 'zh' ? '选填' : 'optional'})</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={modelYear}
                  onChange={(e) => setModelYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">
                  {t('model.upload')} <span className="text-red-500">*</span>
                </label>
                <p className="mt-1 text-xs text-slate-400">{t('model.uploadHint')}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={onFileSelect}
                  className="mt-2 text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                />
                <ul className="mt-2 space-y-1">
                  {uploadFiles.map((item, index) => (
                    <li
                      key={item.id}
                      draggable
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.dataset.dragOver = 'true' }}
                      onDragLeave={(e) => { e.currentTarget.dataset.dragOver = '' }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.dataset.dragOver = ''
                        const from = Number(e.dataTransfer.getData('text/plain'))
                        if (!Number.isNaN(from)) moveFile(from, index)
                      }}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
                      data-drag-over=""
                      className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50/50 py-1.5 pl-2 pr-2 data-[drag-over]:border-blue-400 data-[drag-over]:bg-blue-50/50"
                    >
                      <span className="cursor-grab touch-none text-slate-400" title={locale === 'zh' ? '拖动排序' : 'Drag to reorder'}>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z"/></svg>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.file.name}</span>
                      <button
                        type="button"
                        onClick={() => previewFile(item)}
                        className="shrink-0 text-sm text-blue-600 hover:underline"
                      >
                        {t('model.preview')}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        aria-label="Remove"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-slate-200 p-6 pt-4">
              <button
                type="button"
                onClick={() => !saving && setAddModalOpen(false)}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('country.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveNewModel}
                disabled={saving || !brand.trim() || !modelPart.trim() || uploadFiles.length === 0}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? (locale === 'zh' ? '合并上传中...' : 'Merging & uploading...')
                  : t('country.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
