import React from 'react'
import { useAppConfig } from '@/contexts/AppConfig'

interface AuthLayoutProps {
  title: string
  children: React.ReactNode
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  const { siteName } = useAppConfig()

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
