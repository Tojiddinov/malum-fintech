import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿', short: 'UZ' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', short: 'RU' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
]

/**
 * LanguageSwitcher — compact 3-button pill row
 * @param {'dark'|'light'} theme - dark for sidebar/navbar on dark bg, light for landing navbar on green bg
 */
export default function LanguageSwitcher({ theme = 'dark' }) {
  const { i18n } = useTranslation()
  const current = i18n.language?.slice(0, 2) || 'uz'

  const isDark = theme === 'dark'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)',
        borderRadius: 8,
        padding: '3px 4px',
      }}
      role="group"
      aria-label="Language selector"
    >
      {LANGUAGES.map((lang) => {
        const isActive = current === lang.code
        return (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            title={lang.label}
            aria-pressed={isActive}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: isActive ? 700 : 500,
              background: isActive
                ? isDark
                  ? 'rgba(201,162,39,0.25)'
                  : 'rgba(255,255,255,0.25)'
                : 'transparent',
              color: isActive
                ? isDark ? '#E9C46A' : '#fff'
                : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.15s ease',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.75)' : '#fff'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = isDark
                  ? 'rgba(255,255,255,0.45)'
                  : 'rgba(255,255,255,0.6)'
              }
            }}
          >
            <span style={{ fontSize: 13 }}>{lang.flag}</span>
            <span>{lang.short}</span>
          </button>
        )
      })}
    </div>
  )
}
