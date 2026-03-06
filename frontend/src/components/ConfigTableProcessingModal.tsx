import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { mergeAndUploadModelFiles } from '../api/models'

type UploadFileItem = { id: string; file: File }

interface ConfigTableProcessingModalProps {
  open: boolean
  onClose: () => void
  onSaved: (result: { original_url: string }) => void
  modelId: string
}

export function ConfigTableProcessingModal({
  open,
  onClose,
  onSaved,
  modelId,
}: ConfigTableProcessingModalProps) {
  const { t, locale } = useApp()
  const [uploadFiles, setUploadFiles] = useState<UploadFileItem[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSave = async () => {
    if (uploadFiles.length === 0) return
    setSaving(true)
    try {
      const result = await mergeAndUploadModelFiles(
        modelId,
        uploadFiles.map((item) => item.file)
      )
      onSaved(result)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => !saving && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="shrink-0 p-6 pb-0 text-lg font-semibold text-slate-800">
          {t('configProcessing.title')}
        </h3>
        <p className="mt-2 px-6 text-sm text-slate-500">
          {t('configProcessing.uploadHint')}
        </p>
        <div className="mt-4 flex-1 overflow-y-auto px-6 py-4">
          <label className="cursor-pointer rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
            {t('model.chooseFile')}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={onFileSelect}
              className="sr-only"
            />
          </label>
          <ul className="mt-3 space-y-1">
            {uploadFiles.map((item, index) => (
              <li
                key={item.id}
                draggable
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.dataset.dragOver = 'true'
                }}
                onDragLeave={(e) => {
                  e.currentTarget.dataset.dragOver = ''
                }}
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
                <span
                  className="cursor-grab touch-none text-slate-400"
                  title={locale === 'zh' ? '拖动排序' : 'Drag to reorder'}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {item.file.name}
                </span>
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
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 p-6 pt-4">
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('configProcessing.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadFiles.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? (locale === 'zh' ? '保存中...' : 'Saving...')
              : t('configProcessing.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
