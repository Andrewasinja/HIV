import { useLanguage } from '../i18n/LanguageContext.jsx'
import { LEVEL_ICONS } from '../icons.js'

const LEVELS = ['low', 'medium', 'high']

export default function RiskBadge({ level, size = 'large' }) {
  const { t } = useLanguage()
  const Icon = LEVEL_ICONS[level]

  return (
    <div className={`risk-badge risk-${level} risk-${size}`}>
      {size === 'large' && (
        <span className="risk-icon">
          <Icon size={44} aria-hidden="true" />
        </span>
      )}
      <span className="risk-name">{t(`result.levels.${level}.name`)}</span>
      <div className="risk-meter" aria-hidden="true">
        {LEVELS.map((l) => (
          <span key={l} className={`meter-seg seg-${l} ${l === level ? 'on' : ''}`} />
        ))}
      </div>
    </div>
  )
}
