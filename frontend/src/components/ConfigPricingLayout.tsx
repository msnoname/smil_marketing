import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon } from './Icons'
import { searchModels, type ModelItem } from '../api/models'

const DEBOUNCE_MS = 300

/** 配置定价 Tab 下的共享布局：左侧栏（搜索 + 车型列表）+ 主内容区 */
export function ConfigPricingLayout() {
  const { t, countryId, locale } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<ModelItem[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 从编辑页保存返回时带有 searchQuery，用于刷新列表；清除 state 避免重复应用
  useEffect(() => {
    const state = location.state as { searchQuery?: string } | undefined
    if (state?.searchQuery) {
      setSearchQuery(state.searchQuery)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

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

  const handleAddNew = () => {
    navigate('/config-pricing/edit', { state: { searchQuery: searchQuery.trim() } })
  }

  const handleEditModel = (e: React.MouseEvent, item: ModelItem) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/config-pricing/edit', {
      state: {
        modelId: item.id,
        brand: item.brand,
        model: item.model,
        model_year: item.model_year,
      },
    })
  }

  const showDropdown = dropdownOpen && countryId && searchQuery.trim().length > 0

  return (
    <div className="flex min-h-[calc(100vh-3.5rem-3rem)] w-full gap-0">
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
                          <div
                            key={item.id}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                          >
                            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedModelId === item.id}
                                onChange={() =>
                                  setSelectedModelId((prev) =>
                                    prev === item.id ? null : item.id
                                  )
                                }
                                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="min-w-0 truncate" title={item.model}>{item.model}</span>
                            </label>
                            <button
                              type="button"
                              onClick={(e) => handleEditModel(e, item)}
                              className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                              aria-label={locale === 'zh' ? '编辑' : 'Edit'}
                            >
                              <PencilIcon size={16} />
                            </button>
                          </div>
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
        <Outlet />
      </div>
    </div>
  )
}
