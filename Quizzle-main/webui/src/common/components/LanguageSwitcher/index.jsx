import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/i18n'
import './styles.sass'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <div className="lang-switcher">
      <button className="lang-switcher__btn" onClick={() => setOpen(o => !o)}>
        <span>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span className={`lang-switcher__arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="lang-switcher__dropdown">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`lang-switcher__option ${lang.code === i18n.language ? 'active' : ''}`}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false) }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}