import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { handleCallback } from '@/auth/AuthService'
import { MainLayout } from '@/layouts'

const CallbackPage: React.FC = () => {
  const history = useHistory()
  const [error, setError] = useState('')

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
      .then((success) => {
        if (success) {
          history.replace('/user')
        } else {
          setError('Failed to exchange authorization code')
        }
      })
      .catch((e) => setError(e.message || 'Unexpected error'))
  }, [history])

  if (error) {
    return (
      <MainLayout scope="user" title="Authentication Error">
        <div className="alert alert-danger">{error}</div>
        <a href="/auth/login" className="btn btn-primary">
          Back to Login
        </a>
      </MainLayout>
    )
  }

  return (
    <MainLayout scope="user" title="Authenticating...">
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '200px' }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="sr-only">Authenticating...</span>
          </div>
          <p>Please wait while we sign you in...</p>
        </div>
      </div>
    </MainLayout>
  )
}

export default CallbackPage
