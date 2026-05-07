import React from 'react'
import { useAppConfig } from '@/contexts/AppConfig'

interface SkinlibLayoutProps {
  children: React.ReactNode
}

export function SkinlibLayout({ children }: SkinlibLayoutProps) {
  const { siteName } = useAppConfig()

  return (
    <div className="wrapper">
      <nav className="main-header navbar navbar-expand navbar-white navbar-light ml-0">
        <div className="container">
          <div className="navbar-header">
            <a href="/" className="navbar-brand">
              {siteName || 'Blessing Skin'}
            </a>
          </div>
          <div className="collapse navbar-collapse">
            <ul className="nav navbar-nav">
              <li className="nav-item active">
                <a className="nav-link" href="/skinlib">
                  Skin Library
                </a>
              </li>
            </ul>
          </div>
          <div className="navbar-custom-menu">
            <ul className="nav navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="/auth/login">
                  <i className="fas fa-user"></i>
                  <span className="d-none d-sm-inline">Guest</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {children}
      <footer className="main-footer">
        <div className="container">
          <strong>Copyright &copy; Blessing Skin Community.</strong> All rights
          reserved.
        </div>
      </footer>
    </div>
  )
}
