import { ArrowLeft, ArrowRight, CircleCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { predict } from '../api.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { FIELD_ICONS } from '../icons.js'
import { AGE_MAX, AGE_MIN, QUESTIONS } from '../questions.js'
import { loadAnswers, saveAnswers, saveResult } from '../storage.js'

const ADVANCE_DELAY_MS = 250

export default function Screening() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState(loadAnswers)
  const [step, setStep] = useState(0)
  const [ageText, setAgeText] = useState(() => (answers.age ? String(answers.age) : ''))
  const [ageError, setAgeError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const advancing = useRef(false)

  const question = QUESTIONS[step]
  const total = QUESTIONS.length
  const isLast = step === total - 1

  useEffect(() => saveAnswers(answers), [answers])

  const submit = async (finalAnswers) => {
    setSubmitting(true)
    setError(false)
    try {
      const result = await predict(finalAnswers, lang)
      saveResult({ answers: finalAnswers, result, date: new Date().toISOString() })
      navigate('/result')
    } catch {
      setError(true)
      setSubmitting(false)
    }
  }

  const goNext = (updated) => {
    if (isLast) submit(updated)
    else setStep((s) => s + 1)
  }

  const choose = (value) => {
    if (advancing.current) return
    advancing.current = true
    const updated = { ...answers, [question.field]: value }
    setAnswers(updated)
    setTimeout(() => {
      advancing.current = false
      goNext(updated)
    }, ADVANCE_DELAY_MS)
  }

  const submitAge = (e) => {
    e.preventDefault()
    const age = Number(ageText)
    if (!Number.isInteger(age) || age < AGE_MIN || age > AGE_MAX) {
      setAgeError(true)
      return
    }
    setAgeError(false)
    const updated = { ...answers, age }
    setAnswers(updated)
    goNext(updated)
  }

  if (submitting) {
    return (
      <section className="container page center-state">
        <div className="spinner" aria-hidden="true" />
        <p>{t('screening.submitting')}</p>
      </section>
    )
  }

  const q = (key, vars) => t(`questions.${question.field}.${key}`, vars)
  const help = q('help', { min: AGE_MIN, max: AGE_MAX })
  const hasHelp = help !== `questions.${question.field}.help`

  const Icon = FIELD_ICONS[question.field]

  return (
    <section className="container page screening">
      <div className="progress" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <p className="progress-label">{t('screening.progress', { n: step + 1, total })}</p>

      <div className="card question-card" key={question.field}>
        <span className="question-icon">
          <Icon size={28} aria-hidden="true" />
        </span>
        <h1 className="question">{q('q')}</h1>
        {hasHelp && <p className="help">{help}</p>}

        {question.type === 'number' ? (
          <form onSubmit={submitAge} className="age-form">
            <input
              type="number"
              inputMode="numeric"
              min={AGE_MIN}
              max={AGE_MAX}
              value={ageText}
              onChange={(e) => setAgeText(e.target.value)}
              aria-label={q('label')}
              aria-invalid={ageError}
              autoFocus
            />
            {ageError && <p className="field-error">{q('invalid', { min: AGE_MIN, max: AGE_MAX })}</p>}
            <button type="submit" className="btn btn-primary btn-large">
              {t('common.next')}
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <div className={`options ${question.options.length === 2 ? 'options-two' : ''}`}>
            {question.options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`option ${answers[question.field] === opt ? 'selected' : ''}`}
                aria-pressed={answers[question.field] === opt}
                onClick={() => choose(opt)}
              >
                <span>{q(`options.${opt}`)}</span>
                {answers[question.field] === opt && <CircleCheck size={22} className="option-check" aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="error-box" role="alert">
            <p>{t('common.error')}</p>
            <button type="button" className="btn btn-secondary" onClick={() => submit(answers)}>
              {t('common.retry')}
            </button>
          </div>
        )}
      </div>

      {step > 0 && (
        <button type="button" className="btn btn-link" onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t('common.back')}
        </button>
      )}
    </section>
  )
}
