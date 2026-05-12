import React from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useAppConfig } from '@/contexts/AppConfig'
import { useAuth } from '@/auth/AuthContext'
import { t } from '@/scripts/i18n'
import '@/styles/home.css'

const FEATURES = ['first', 'second', 'third'] as const

export default function Home() {
  const { siteName, siteDescription, homePicUrl } = useAppConfig()
  const { isAuth, user } = useAuth()
  const history = useHistory()

  const bgUrl = homePicUrl || '/app/bg.webp'

  return (
    <div className="layout-top-nav">
      <div className="hp-wrapper" style={{ backgroundImage: `url(${bgUrl})` }}>
        <nav className="navbar navbar-expand fixed-top navbar-dark navbar-light ml-0 transparent">
          <div className="container">
            <div className="navbar-header">
              <Link to="/" className="navbar-brand">
                {siteName || 'Blessing Skin'}
              </Link>
            </div>

            <div className="navbar-custom-menu">
              <ul className="nav navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to="/skinlib">
                    {t('general.skinlib')}
                  </Link>
                </li>

                {isAuth ? (
                  <li className="nav-item dropdown user-menu">
                    <Link
                      to="/user"
                      className="nav-link d-flex align-items-center"
                    >
                      <span className="d-none d-md-inline d-sm-block">
                        {user?.nickname || user?.email || t('general.user')}
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li className="nav-item">
                    <Link className="nav-link" to="/auth/login">
                      <i className="icon fas fa-sign-in-alt"></i>{' '}
                      {t('general.login')}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>

        <div className="container">
          <div className="splash">
            <h1 className="splash-head">{siteName || 'Blessing Skin'}</h1>
            <p className="splash-subhead">
              {siteDescription ||
                t('index.introduction', { sitename: siteName })}
            </p>
            <p>
              {isAuth ? (
                <button
                  className="main-button"
                  onClick={() => history.push('/user')}
                >
                  {t('general.user-center')}
                </button>
              ) : (
                <button
                  className="main-button"
                  onClick={() => history.push('/auth/register')}
                >
                  {t('general.register')}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>

      <div id="intro">
        <div className="container">
          <div className="text-center">
            <h1>{t('index.features.title')}</h1>
            <br />
            <br />
            <div className="container-lg">
              <div className="row">
                {FEATURES.map((item) => (
                  <div className="col-lg-4" key={item}>
                    <i
                      className={`fas ${t(`index.features.${item}.icon`)} mb-3`}
                      aria-hidden="true"
                    />
                    <h3>{t(`index.features.${item}.name`)}</h3>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: t(`index.features.${item}.desc`),
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <br />
        </div>
      </div>

      <div id="footer-wrap">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-2">
              {t('index.introduction', { sitename: siteName })}
            </div>
            <div className="col-lg-4"></div>
            <div className="col-lg-2 d-flex justify-content-center align-items-center">
              <button
                className="main-button"
                onClick={() => history.push('/auth/register')}
              >
                {t('index.start')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="copyright" className="with-intro">
        <div className="container">
          <strong>
            Copyright &copy; {siteName || 'Blessing Skin'} Community.
          </strong>{' '}
          All rights reserved.
        </div>
      </div>
    </div>
  )
}
