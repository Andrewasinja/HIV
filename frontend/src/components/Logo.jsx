import { useId } from 'react'

// Red awareness ribbon inside a protective shield: awareness + protection.
export function LogoMark({ size = 40 }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3354f" />
          <stop offset="1" stopColor="#9e1530" />
        </linearGradient>
      </defs>
      <path
        d="M32 3 L55 11.5 V29 C55 44.5 45.5 55 32 61 C18.5 55 9 44.5 9 29 V11.5 Z"
        fill={`url(#${id}-g)`}
      />
      <path
        d="M32 3 L55 11.5 V29 C55 44.5 45.5 55 32 61"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.18"
        strokeWidth="2"
      />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M37.5 25 C37.5 32 31 40 22.5 50.5" stroke="#fff" strokeWidth="5.5" />
        <path d="M26.5 25 C26.5 32 33 40 41.5 50.5" stroke="#b81d3a" strokeWidth="9.5" />
        <path d="M26.5 25 C26.5 32 33 40 41.5 50.5" stroke="#fff" strokeWidth="5.5" />
        <path d="M26.5 25 C26.5 14 37.5 14 37.5 25" stroke="#fff" strokeWidth="5.5" />
      </g>
    </svg>
  )
}

export default function Logo({ name, tagline }) {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-text">
        <span className="logo-name">{name}</span>
        {tagline && <span className="logo-tagline">{tagline}</span>}
      </span>
    </span>
  )
}
