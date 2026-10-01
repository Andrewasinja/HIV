const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

export const predict = (answers, language) => post('/predict/', { ...answers, language })
export const simulate = (answers, language) => post('/simulate/', { ...answers, language })

let optionsPromise
export function getOptions() {
  optionsPromise ??= fetch(`${BASE}/form-options/`)
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => {
      optionsPromise = undefined
      return {}
    })
  return optionsPromise
}

// Returns an object URL for Luganda speech audio; the caller must revoke it.
export async function fetchSpeech(text, signal) {
  const res = await fetch(`${BASE}/tts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang: 'lg' }),
    signal,
  })
  if (!res.ok) throw new Error(`Speech failed (${res.status})`)
  return URL.createObjectURL(await res.blob())
}
