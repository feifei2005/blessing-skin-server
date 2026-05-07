import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

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
                {user?.nickname || user?.email || 'User'}
              </span>
            </a>
            <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
              <Link className="dropdown-item" to="/user">
                <i className="fas fa-home mr-2"></i> Dashboard
              </Link>
              <Link className="dropdown-item" to="/user/profile">
                <i className="fas fa-user mr-2"></i> Profile
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
                <i className="fas fa-sign-out-alt mr-2"></i> Logout
              </a>
            </div>
          </li>
        ) : (
          <li className="nav-item">
            <Link className="nav-link" to="/auth/login">
              <i className="fas fa-sign-in-alt mr-1"></i> Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
