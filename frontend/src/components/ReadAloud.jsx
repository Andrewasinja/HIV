import { AudioLines, Pause, Play, Square, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getOptions } from '../api.js'
import { pickVoice, useSpeech } from '../hooks/useSpeech.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

function useServerLugandaVoice() {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    let active = true
    getOptions().then((opts) => active && setAvailable(Boolean(opts.luganda_voice)))
    return () => {
      active = false
    }
  }, [])
  return available
}

export default function ReadAloud({ script, onSection }) {
  const { t, lang } = useLanguage()
  const { supported, voices, status, fellBack, speak, pause, resume, stop } = useSpeech()
  const serverVoice = useServerLugandaVoice()

  if (!supported) {
    return <p className="voice-note no-print">{t('voice.unsupported')}</p>
  }

  const { exact } = pickVoice(voices, lang)
  const usingServer = lang === 'lg' && serverVoice
  const showFallbackNote = lang === 'lg' && !exact && (usingServer ? fellBack : true)

  const stopAll = () => {
    stop()
    onSection(null)
  }

  const liveText = { preparing: t('voice.preparing'), playing: t('voice.reading'), paused: t('voice.paused') }[status]

  return (
    <div className={`read-aloud no-print ${status !== 'idle' ? 'active' : ''}`}>
      {status === 'idle' ? (
        <button type="button" className="btn btn-listen" onClick={() => speak(script, lang, onSection, usingServer)}>
          <Volume2 size={22} aria-hidden="true" />
          {t('voice.listen')}
        </button>
      ) : (
        <div className="voice-controls" role="group" aria-label={t('voice.listen')}>
          <span className="voice-live" aria-live="polite">
            {status === 'preparing' ? (
              <span className="mini-spinner" aria-hidden="true" />
            ) : (
              <AudioLines size={22} className={status === 'playing' ? 'pulse' : ''} aria-hidden="true" />
            )}
            {liveText}
          </span>
          {status === 'playing' && (
            <button type="button" className="icon-btn" onClick={pause} aria-label={t('voice.pause')} title={t('voice.pause')}>
              <Pause size={20} aria-hidden="true" />
            </button>
          )}
          {status === 'paused' && (
            <button type="button" className="icon-btn" onClick={resume} aria-label={t('voice.resume')} title={t('voice.resume')}>
              <Play size={20} aria-hidden="true" />
            </button>
          )}
          <button type="button" className="icon-btn" onClick={stopAll} aria-label={t('voice.stop')} title={t('voice.stop')}>
            <Square size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {showFallbackNote && <p className="voice-note">{t('voice.fallback')}</p>}
    </div>
  )
}
