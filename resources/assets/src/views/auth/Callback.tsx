import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { handleCallback } from '@/auth/AuthService'
import { useAuth } from '@/auth/AuthContext'
import { MainLayout } from '@/layouts'
import { t } from '@/scripts/i18n'

const CallbackPage: React.FC = () => {
  const history = useHistory()
  const [error, setError] = useState('')
  const { refreshUser } = useAuth()

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const errorParam = url.searchParams.get('error')

    if (errorParam) {
      setError(errorParam)
      return
    }

    if (!code || !state) {
      setError('Missing authorization parameters')
      return
    }

    handleCallback(code, state)
      .then(async (success) => {
        if (success) {
          await refreshUser()
          history.replace('/user')
        } else {
          setError('Failed to exchange authorization code')
        }
      })
      .catch((e) => setError(e.message || 'Unexpected error'))
  }, [history, refreshUser])

  if (error) {
    return (
      <MainLayout scope="user" title={t('auth.callback.errorTitle')}>
        <div className="alert alert-danger">{error}</div>
        <a href="/auth/login" className="btn btn-primary">
          {t('auth.callback.backToLogin')}
        </a>
      </MainLayout>
    )
  }

  return (
    <MainLayout scope="user" title={t('auth.callback.authenticating')}>
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '200px' }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="sr-only">{t('auth.callback.authenticating')}</span>
          </div>
          <p>{t('auth.callback.waitMessage')}</p>
        </div>
      </div>
    </MainLayout>
  )
}

export default CallbackPage
