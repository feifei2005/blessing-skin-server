import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { t } from '@/scripts/i18n'
import { AuthLayout } from '@/layouts'

const Login: React.FC = () => {
  const [loggingIn, setLoggingIn] = useState(false)
  const { login } = useAuth()

  const handleLogin = () => {
    setLoggingIn(true)
    login()
  }

  return (
    <AuthLayout title={t('auth.login')}>
      <p className="login-box-msg">{t('auth.login')}</p>

      {loggingIn && (
        <div className="text-center mb-3">
          <i className="fas fa-spinner fa-spin mr-1"></i>
          {t('auth.loggingIn')}
        </div>
      )}

      <button
        className="btn btn-primary btn-block"
        type="button"
        disabled={loggingIn}
        onClick={handleLogin}
      >
        {loggingIn ? (
          <>
            <i className="fas fa-spinner fa-spin mr-1"></i>
            {t('auth.loggingIn')}
          </>
        ) : (
          t('auth.login')
        )}
      </button>

      <div className="d-flex justify-content-between mt-3">
        <Link to="/auth/register">{t('auth.register-link')}</Link>
        <Link to="/auth/forgot">{t('auth.forgot-link')}</Link>
      </div>
    </AuthLayout>
  )
}

export default Login
