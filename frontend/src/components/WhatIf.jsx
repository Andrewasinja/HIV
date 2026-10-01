import { ArrowRight, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { simulate } from '../api.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { FIELD_ICONS } from '../icons.js'
import { WHATIF_FIELDS, optionsFor } from '../questions.js'
import RiskBadge from './RiskBadge.jsx'

const DEBOUNCE_MS = 300

export default function WhatIf({ answers, level }) {
  const { t, lang } = useLanguage()
  const [changed, setChanged] = useState(answers)
  // Result of the latest finished simulation, tagged with the answers it was computed for.
  const [sim, setSim] = useState({ key: null, level: null, error: false })

  const isChanged = WHATIF_FIELDS.some((f) => changed[f] !== answers[f])
  const key = JSON.stringify(changed)
  const loading = isChanged && sim.key !== key
  const newLevel = isChanged && !loading && !sim.error ? sim.level : level
  const error = isChanged && !loading && sim.error

  useEffect(() => {
    if (!isChanged) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await simulate(changed, lang)
        if (!cancelled) setSim({ key, level: res.risk_level, error: false })
      } catch {
        if (!cancelled) setSim({ key, level: null, error: true })
      }
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [changed, isChanged, key, lang])

  return (
    <section className="card whatif no-print">
      <h2 className="card-title">
        <SlidersHorizontal size={22} aria-hidden="true" />
        {t('whatif.title')}
      </h2>
      <p className="muted">{t('whatif.intro')}</p>

      {WHATIF_FIELDS.map((field) => {
        const Icon = FIELD_ICONS[field]
        return (
        <fieldset key={field} className="whatif-field">
          <legend>
            <Icon size={18} aria-hidden="true" />
            {t(`questions.${field}.label`)}
          </legend>
          <div className="chips">
            {optionsFor(field).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`chip ${changed[field] === opt ? 'selected' : ''} ${answers[field] === opt ? 'original' : ''}`}
                aria-pressed={changed[field] === opt}
                onClick={() => setChanged({ ...changed, [field]: opt })}
              >
                {t(`questions.${field}.options.${opt}`)}
              </button>
            ))}
          </div>
        </fieldset>
        )
      })}

      <div className="whatif-compare" aria-live="polite">
        <div>
          <p className="compare-label">{t('whatif.now')}</p>
          <RiskBadge level={level} size="small" />
        </div>
        <ArrowRight size={26} className="compare-arrow" aria-hidden="true" />
        <div>
          <p className="compare-label">{t('whatif.would')}</p>
          {loading ? <p className="muted">{t('whatif.checking')}</p> : <RiskBadge level={newLevel} size="small" />}
        </div>
      </div>

      {error && <p className="field-error">{t('common.error')}</p>}

      {isChanged && (
        <button type="button" className="btn btn-link" onClick={() => setChanged(answers)}>
          <RotateCcw size={16} aria-hidden="true" />
          {t('whatif.reset')}
        </button>
      )}
    </section>
  )
}
