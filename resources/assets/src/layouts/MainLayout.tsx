import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAppConfig } from '@/contexts/AppConfig'
import { useAuth } from '@/auth/AuthContext'
import EmailVerification from '@/views/widgets/EmailVerification'

interface MainLayoutProps {
  scope: 'user' | 'admin'
  title: string
  children: React.ReactNode
}

export function MainLayout({ scope, title, children }: MainLayoutProps) {
  const { version, siteName } = useAppConfig()
  const { user } = useAuth()
  return (
    <div className="wrapper">
      <Header />
      <Sidebar scope={scope} />
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <div className="d-flex justify-content-between flex-wrap">
              <div>
                <h1 className="m-0">{title}</h1>
              </div>
              <div>
                <div className="breadcrumb"></div>
              </div>
            </div>
          </div>
        </div>
        <section className="content">
          <div className="container-fluid">
            {user && !user.verified && <EmailVerification />}
            {children}
          </div>
        </section>
      </div>
      <footer className="main-footer">
        <div className="float-right d-none d-sm-block">
          <b>Version</b> {version || 'Blessing Skin'}
        </div>
        <strong>
          Copyright &copy; {siteName || 'Blessing Skin'} Community.
        </strong>{' '}
        All rights reserved.
      </footer>
      <div id="previewer"></div>
    </div>
  )
}
