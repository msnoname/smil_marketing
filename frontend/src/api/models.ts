const API_BASE = '/api'

export interface ModelItem {
  id: string
  country_id: string
  brand: string
  model: string
  model_year?: number | null
  original_url?: string | null
}

export async function searchModels(
  countryId: string,
  q: string
): Promise<ModelItem[]> {
  const params = new URLSearchParams({ country_id: countryId })
  if (q.trim()) params.set('q', q.trim())
  const res = await fetch(`${API_BASE}/models?${params}`)
  if (!res.ok) throw new Error('Failed to search models')
  return res.json()
}

export async function suggestBrands(
  countryId: string,
  q: string
): Promise<string[]> {
  const params = new URLSearchParams({ country_id: countryId })
  if (q.trim()) params.set('q', q.trim())
  const res = await fetch(`${API_BASE}/models/brands?${params}`)
  if (!res.ok) throw new Error('Failed to suggest brands')
  return res.json()
}

export async function createModel(data: {
  country_id: string
  brand: string
  model: string
  model_year?: number | null
}): Promise<ModelItem> {
  const res = await fetch(`${API_BASE}/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create model')
  return res.json()
}

/** 保存时按顺序合并 PDF/图片并上传，返回合并后的文件 URL */
export async function mergeAndUploadModelFiles(
  modelId: string,
  files: File[]
): Promise<{ original_url: string }> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await fetch(`${API_BASE}/models/${modelId}/files/merge`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Failed to merge and upload files')
  return res.json()
}
