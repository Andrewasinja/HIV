import { ArrowRight, BadgeCheck, ClipboardList, EyeOff, Gauge, HeartHandshake, Info, ShieldCheck, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImg from '../assets/hero-ribbon.jpg'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { clearAll } from '../storage.js'

const STEP_ICONS = [ClipboardList, Gauge, HeartHandshake]
const PILL_ICONS = [Timer, EyeOff, BadgeCheck]

export default function Home() {
  const { t } = useLanguage()

  return (
    <>
      <section className="hero" style={{ '--hero-img': `url(${heroImg})` }}>
        <div className="container hero-inner">
          <p className="eyebrow">{t('app.tagline')}</p>
          <h1>{t('home.title')}</h1>
          <p className="lead">{t('home.intro')}</p>

          <ul className="pills">
            {t('home.pills').map((pill, i) => {
              const Icon = PILL_ICONS[i]
              return (
                <li key={i}>
                  <Icon size={16} aria-hidden="true" />
                  {pill}
                </li>
              )
            })}
          </ul>

          <Link to="/check" className="btn btn-primary btn-cta" onClick={clearAll}>
            {t('home.start')}
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="container home-body">
        <h2 className="section-title">{t('home.howTitle')}</h2>
        <ol className="steps">
          {t('home.steps').map((step, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <li key={i}>
                <span className="step-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="step-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            )
          })}
        </ol>

        <div className="card privacy">
          <ShieldCheck size={32} className="privacy-icon" aria-hidden="true" />
          <div>
            <h2>{t('home.privacyTitle')}</h2>
            <p>{t('home.privacy')}</p>
          </div>
        </div>

        <p className="disclaimer">
          <Info size={18} aria-hidden="true" />
          <span>{t('home.disclaimer')}</span>
        </p>
      </div>
    </>
  )
}
