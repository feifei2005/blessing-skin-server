import React from 'react'
import { Link } from 'react-router-dom'
import { useAppConfig } from '@/contexts/AppConfig'
import { useAuth } from '@/auth/AuthContext'

interface SkinlibLayoutProps {
  children: React.ReactNode
}

export function SkinlibLayout({ children }: SkinlibLayoutProps) {
  const { siteName } = useAppConfig()
  const { isAuth, user } = useAuth()

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
              <li className="nav-item">
                <Link className="nav-link" to="/skinlib">
                  Skin Library
                </Link>
              </li>
            </ul>
          </div>
          <div className="navbar-custom-menu">
            <ul className="nav navbar-nav">
              <li className="nav-item">
                {isAuth && user ? (
                  <Link className="nav-link" to="/user">
                    <i className="fas fa-user mr-1"></i>
                    {user.nickname}
                  </Link>
                ) : (
                  <Link className="nav-link" to="/auth/login">
                    <i className="fas fa-user mr-1"></i>Guest
                  </Link>
                )}
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
      <div id="previewer"></div>
    </div>
  )
}
