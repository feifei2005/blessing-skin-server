import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { t } from '@/scripts/i18n'

export function Header() {
  const { isAuth, user, logout } = useAuth()

  return (
    <nav className="main-header navbar navbar-expand navbar-white navbar-light">
      <ul className="navbar-nav">
        <li className="nav-item">
          <a className="nav-link" data-widget="pushmenu" href="#">
            <i className="fas fa-bars"></i>
          </a>
        </li>
      </ul>
      <ul className="navbar-nav ml-auto">
        {isAuth ? (
          <li className="nav-item dropdown user-menu">
            <a
              href="#"
              className="nav-link d-flex align-items-center"
              data-toggle="dropdown"
            >
              <span className="d-none d-md-inline d-sm-block">
                {user?.nickname || user?.email || t('general.user')}
              </span>
            </a>
            <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
              <Link className="dropdown-item" to="/user">
                <i className="fas fa-home mr-2"></i> {t('general.dashboard')}
              </Link>
              <Link className="dropdown-item" to="/user/profile">
                <i className="fas fa-user mr-2"></i> {t('general.profile')}
              </Link>
              <div className="dropdown-divider"></div>
              <a
                className="dropdown-item"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  logout()
                }}
              >
                <i className="fas fa-sign-out-alt mr-2"></i>{' '}
                {t('general.logout')}
              </a>
            </div>
          </li>
        ) : (
          <li className="nav-item">
            <Link className="nav-link" to="/auth/login">
              <i className="fas fa-sign-in-alt mr-1"></i> {t('general.login')}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
