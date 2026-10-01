import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSpeech } from '../api.js'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

// Browsers rarely ship a Luganda voice. Swahili voices pronounce Luganda's
// phonetic spelling far better than English ones, so they are the first fallback.
const LANG_PREFS = {
  en: ['en-ug', 'en-ke', 'en-tz', 'en-ng', 'en-za', 'en-gb', 'en'],
  lg: ['lg', 'sw', 'en-ug', 'en-ke', 'en'],
}

// Zero-length WAV played inside the click handler to unlock audio on iOS/Safari,
// whose autoplay rules would otherwise block playback after the async fetch.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

// Neural "Natural"/"Online" voices (Edge, Chrome) sound much more human.
const quality = (v) => (/natural|online|neural|google/i.test(v.name) ? 1 : 0)

export function pickVoice(voices, lang) {
  for (const pref of LANG_PREFS[lang] || LANG_PREFS.en) {
    const matches = voices
      .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(pref))
      .sort((a, b) => quality(b) - quality(a))
    if (matches.length) {
      return { voice: matches[0], exact: matches[0].lang.toLowerCase().startsWith(lang) }
    }
  }
  return { voice: null, exact: false }
}

// Chrome silently stops utterances longer than ~15s, so speak sentence by sentence.
const toSentences = (text) => text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || []

export function useSpeech() {
  const [voices, setVoices] = useState(() => synth?.getVoices() ?? [])
  // idle | preparing | playing | paused
  const [status, setStatus] = useState('idle')
  const [fellBack, setFellBack] = useState(false)
  const runId = useRef(0)
  const audioRef = useRef(null)
  const engine = useRef(null)
  const cleanup = useRef(() => {})

  const halt = useCallback(() => {
    runId.current += 1
    synth?.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
    }
    cleanup.current()
    cleanup.current = () => {}
  }, [])

  useEffect(() => {
    const update = () => setVoices(synth.getVoices())
    synth?.addEventListener('voiceschanged', update)
    return () => {
      synth?.removeEventListener('voiceschanged', update)
      halt()
    }
  }, [halt])

  const stop = useCallback(() => {
    halt()
    setStatus('idle')
  }, [halt])

  // parts: [{ section, text }]; onSection(section | null) fires as reading moves on.
  // useServerVoice: fetch real Luganda audio from the backend (Sunbird) instead of browser voices.
  const speak = useCallback(
    (parts, lang, onSection, useServerVoice = false) => {
      halt()
      const id = ++runId.current
      const alive = () => id === runId.current
      const { voice } = pickVoice(voices, lang)
      setFellBack(false)

      const speakWeb = (text) =>
        new Promise((resolve) => {
          if (!synth) return resolve()
          engine.current = 'web'
          const queue = toSentences(text)
          let i = 0
          const next = () => {
            if (!alive() || i >= queue.length) return resolve()
            const u = new SpeechSynthesisUtterance(queue[i])
            if (voice) u.voice = voice
            u.lang = voice?.lang || (lang === 'lg' ? 'sw-KE' : 'en-GB')
            u.rate = 0.92
            u.onend = () => {
              i += 1
              next()
            }
            u.onerror = (e) => {
              if (e.error === 'interrupted' || e.error === 'canceled') return resolve()
              i += 1
              next()
            }
            synth.speak(u)
          }
          next()
        })

      const playAudio = (url) =>
        new Promise((resolve) => {
          const audio = audioRef.current
          engine.current = 'audio'
          audio.onended = () => resolve(true)
          audio.onerror = () => resolve(false)
          audio.src = url
          audio.play().catch(() => resolve(false))
        })

      let audioJobs = null
      if (useServerVoice && lang === 'lg') {
        audioRef.current ??= new Audio()
        audioRef.current.src = SILENT_WAV
        audioRef.current.play().catch(() => {})

        const controller = new AbortController()
        const urls = []
        audioJobs = parts.map((p) =>
          fetchSpeech(p.text, controller.signal)
            .then((url) => {
              urls.push(url)
              return url
            })
            .catch(() => null),
        )
        cleanup.current = () => {
          controller.abort()
          urls.forEach((u) => URL.revokeObjectURL(u))
        }
        setStatus('preparing')
      } else {
        setStatus('playing')
      }

      const run = async () => {
        for (let i = 0; i < parts.length; i += 1) {
          const url = audioJobs ? await audioJobs[i] : null
          if (!alive()) return
          setStatus((s) => (s === 'preparing' ? 'playing' : s))
          onSection?.(parts[i].section)
          const played = url ? await playAudio(url) : false
          if (!alive()) return
          if (!played) {
            if (audioJobs) setFellBack(true)
            await speakWeb(parts[i].text)
          }
          if (!alive()) return
        }
        cleanup.current()
        cleanup.current = () => {}
        setStatus('idle')
        onSection?.(null)
      }
      run()
    },
    [voices, halt],
  )

  const pause = useCallback(() => {
    if (engine.current === 'audio') audioRef.current?.pause()
    else synth?.pause()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (engine.current === 'audio') audioRef.current?.play().catch(() => {})
    else synth?.resume()
    setStatus('playing')
  }, [])

  return { supported: !!synth || typeof Audio !== 'undefined', voices, status, fellBack, speak, pause, resume, stop }
}
