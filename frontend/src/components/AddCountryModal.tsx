import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { createCountry } from '../api/countries'

interface AddCountryModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function AddCountryModal({ open, onClose, onSaved }: AddCountryModalProps) {
  const { t, locale } = useApp()
  const [countryCn, setCountryCn] = useState('')
  const [countryEn, setCountryEn] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const cn = countryCn.trim()
    const en = countryEn.trim()
    if (!cn || !en) {
      setError(locale === 'zh' ? '请填写中英文名称' : 'Please fill in both names')
      return
    }
    setError('')
    setSaving(true)
    try {
      await createCountry({ country_cn: cn, country_en: en })
      setCountryCn('')
      setCountryEn('')
      onSaved()
      onClose()
    } catch {
      setError(locale === 'zh' ? '保存失败，请重试' : 'Save failed, please retry')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setCountryCn('')
    setCountryEn('')
    setError('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
      <div
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-800">{t('country.add')}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600">{t('country.nameZh')}</label>
            <input
              type="text"
              value={countryCn}
              onChange={(e) => setCountryCn(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t('country.nameZh')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">{t('country.nameEn')}</label>
            <input
              type="text"
              value={countryEn}
              onChange={(e) => setCountryEn(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t('country.nameEn')}
            />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
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
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t('country.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
