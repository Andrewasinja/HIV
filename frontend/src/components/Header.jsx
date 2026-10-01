import { House, Info, Languages } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import Logo from './Logo.jsx'

export default function Header() {
  const { lang, setLang, t } = useLanguage()
  const { pathname } = useLocation()
  const onHome = pathname === '/'

  return (
    <header className="header no-print">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label={t('nav.home')}>
          <Logo name={t('app.name')} tagline={t('app.short')} />
        </Link>
        <nav className="header-nav">
          {!onHome && (
            <Link to="/" className="nav-home" aria-label={t('nav.home')}>
              <House size={18} aria-hidden="true" />
              <span>{t('nav.home')}</span>
            </Link>
          )}
          {pathname !== '/about' && (
            <Link to="/about" className="nav-link" aria-label={t('nav.about')}>
              <Info size={18} aria-hidden="true" />
              <span>{t('nav.about')}</span>
            </Link>
          )}
          <div className="lang-toggle" role="group" aria-label={t('nav.language')}>
            <Languages size={16} className="lang-icon" aria-hidden="true" />
            {['en', 'lg'].map((code) => (
              <button
                key={code}
                type="button"
                className={lang === code ? 'active' : ''}
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                {code === 'en' ? 'EN' : 'LG'}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}
