import { CircleCheck, Info, Lightbulb, Printer, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/Logo.jsx'
import ReadAloud from '../components/ReadAloud.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import WhatIf from '../components/WhatIf.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { FIELD_ICONS } from '../icons.js'
import { clearAll, loadResult } from '../storage.js'

export default function Result() {
  const { t, lang } = useLanguage()
  const saved = loadResult()
  // Tagged with the language so a stale highlight never survives a language switch.
  const [reading, setReading] = useState({ lang, section: null })
  const readingSection = reading.lang === lang ? reading.section : null
  const hl = (section) => (readingSection === section ? 'reading' : '')

  const onSection = (section) => {
    setReading({ lang, section })
    if (section) {
      requestAnimationFrame(() =>
        document.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      )
    }
  }

  if (!saved) {
    return (
      <section className="container page center-state">
        <p>{t('result.missing')}</p>
        <Link to="/check" className="btn btn-primary">{t('result.goStart')}</Link>
      </section>
    )
  }

  const { answers, result, date } = saved
  const level = result.risk_level
  const dateText = new Date(date).toLocaleDateString(lang === 'lg' ? 'en-UG' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const factorText = (f) =>
    `${t(`questions.${f.field}.label`)}: ${t(`questions.${f.field}.options.${f.value}`)}. ${t(
      `result.tips.${f.actionable ? f.field : 'background'}`,
    )}`

  const script = [
    { section: 'hero', text: `${t('result.title')}. ${t(`result.levels.${level}.name`)}. ${t(`result.levels.${level}.desc`)}` },
    {
      section: 'factors',
      text: `${t('result.factorsTitle')}. ${
        result.top_factors.length ? result.top_factors.map(factorText).join(' ') : t('result.noFactors')
      }`,
    },
    { section: 'next', text: `${t('result.nextTitle')}. ${t(`result.next.${level}`).join(' ')}` },
    { section: 'disclaimer', text: t('result.disclaimer') },
  ]

  return (
    <section className="container page result">
      <div className="print-header">
        <LogoMark size={36} />
        <strong>{t('app.name')}</strong>
      </div>

      <div className={`card result-hero hero-${level} ${hl('hero')}`} data-section="hero">
        <p className="eyebrow">{t('result.title')}</p>
        <RiskBadge level={level} />
        <p className="lead">{t(`result.levels.${level}.desc`)}</p>
        <p className="muted small">{t('result.date', { date: dateText })}</p>
        <ReadAloud key={lang} script={script} onSection={onSection} />
      </div>

      <div className={`card ${hl('factors')}`} data-section="factors">
        <h2 className="card-title">
          <Lightbulb size={22} aria-hidden="true" />
          {t('result.factorsTitle')}
        </h2>
        {result.top_factors.length === 0 ? (
          <p className="muted">{t('result.noFactors')}</p>
        ) : (
          <ul className="factors">
            {result.top_factors.map((f) => {
              const Icon = FIELD_ICONS[f.field]
              return (
                <li key={f.field} className="factor">
                  <span className="factor-icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="factor-head">
                      <span className="factor-label">{t(`questions.${f.field}.label`)}:</span>{' '}
                      <strong>{t(`questions.${f.field}.options.${f.value}`)}</strong>
                    </p>
                    <p className="factor-tip">{t(`result.tips.${f.actionable ? f.field : 'background'}`)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={`card ${hl('next')}`} data-section="next">
        <h2 className="card-title">
          <Sparkles size={22} aria-hidden="true" />
          {t('result.nextTitle')}
        </h2>
        <ul className="next-steps">
          {t(`result.next.${level}`).map((step, i) => (
            <li key={i}>
              <CircleCheck size={22} className="next-icon" aria-hidden="true" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <WhatIf answers={answers} level={level} />

      <p className={`disclaimer ${hl('disclaimer')}`} data-section="disclaimer">
        <Info size={18} aria-hidden="true" />
        <span>{t('result.disclaimer')}</span>
      </p>

      <div className="actions no-print">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={20} aria-hidden="true" />
          {t('result.print')}
        </button>
        <Link to="/" className="btn btn-secondary" onClick={clearAll}>
          <RotateCcw size={20} aria-hidden="true" />
          {t('result.restart')}
        </Link>
      </div>
    </section>
  )
}
