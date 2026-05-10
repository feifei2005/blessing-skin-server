import React, { useEffect } from 'react'
import { useAppConfig } from '@/contexts/AppConfig'

interface AuthLayoutProps {
  title: string
  children: React.ReactNode
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  const { siteName } = useAppConfig()

  useEffect(() => {
    // AdminLTE requires 'login-page' on <body> for auth page centering/background.
    // Remove 'sidebar-mini' which is the default for dashboard pages.
    document.body.classList.add('login-page')
    document.body.classList.remove('sidebar-mini')

    return () => {
      document.body.classList.remove('login-page')
      document.body.classList.add('sidebar-mini')
    }
  }, [])

  return (
    <div className="login-box">
      <div className="login-logo">
        <a href="/">{siteName || 'Blessing Skin'}</a>
      </div>
      <div className="card">
        <div className="card-body login-card-body">
          <p className="login-box-msg">{title}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
