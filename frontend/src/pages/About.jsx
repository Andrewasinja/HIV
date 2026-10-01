import { Activity, ArrowRight, Gauge, Lock, Pill, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/Logo.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { clearAll } from '../storage.js'

const SECTION_ICONS = [Activity, Gauge, TriangleAlert, Pill, Lock]

export default function About() {
  const { t } = useLanguage()

  return (
    <section className="container page about">
      <div className="about-head">
        <LogoMark size={56} />
        <h1>{t('about.title')}</h1>
      </div>
      {t('about.sections').map((s, i) => {
        const Icon = SECTION_ICONS[i]
        return (
          <div key={s.h} className="card about-card">
            <span className="about-icon">
              <Icon size={24} aria-hidden="true" />
            </span>
            <div>
              <h2>{s.h}</h2>
              <p>{s.p}</p>
            </div>
          </div>
        )
      })}
      <Link to="/check" className="btn btn-primary btn-cta" onClick={clearAll}>
        {t('home.start')}
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
    </section>
  )
}
