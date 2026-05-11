import React from 'react'
import { loadI18n } from '@/scripts/i18n'
import { useAppConfig } from '@/contexts/AppConfig'

const LANGUAGES: Record<string, string> = {
  en: 'English',
  zh_CN: '简体中文',
  zh_TW: '繁體中文',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useAppConfig()

  const handleChange = async (newLocale: string) => {
    await loadI18n(newLocale)
    setLocale?.(newLocale)
  }

  const currentLabel = LANGUAGES[locale] || locale

  return (
    <li className="nav-item dropdown">
      <a className="nav-link" href="#" data-toggle="dropdown">
        <i className="fas fa-globe mr-1"></i>
        <span className="d-none d-md-inline d-sm-block">{currentLabel}</span>
      </a>
      <div className="dropdown-menu dropdown-menu-right">
        {Object.entries(LANGUAGES).map(([code, name]) => (
          <a
            key={code}
            className={`dropdown-item${code === locale ? ' active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleChange(code)
            }}
          >
            {name}
          </a>
        ))}
      </div>
    </li>
  )
}
