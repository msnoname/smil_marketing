const API_BASE = '/api'

export interface CountryItem {
  id: string
  country_cn: string
  country_en: string
}

export async function getCountries(locale: 'zh' | 'en'): Promise<CountryItem[]> {
  const res = await fetch(`${API_BASE}/countries?locale=${locale}`)
  if (!res.ok) throw new Error('Failed to fetch countries')
  return res.json()
}

export async function createCountry(data: { country_cn: string; country_en: string }): Promise<CountryItem> {
  const res = await fetch(`${API_BASE}/countries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create country')
  return res.json()
}
