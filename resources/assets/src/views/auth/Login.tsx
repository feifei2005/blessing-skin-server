import React, { useState, useRef, useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useBlessingExtra } from '@/contexts/AppConfig'
import useEmitMounted from '@/scripts/hooks/useEmitMounted'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { showModal } from '@/scripts/notify'
import { AuthLayout } from '@/layouts'
import Alert from '@/components/Alert'
import Captcha, { type CaptchaHandle } from '@/components/Captcha'
import EmailSuggestion from '@/components/EmailSuggestion'
import { saveToken } from '@/auth/tokenStore'

type SuccessfulResponse = {
  code: 0
  message: string
  data: {
    redirectTo: string
    token?: string
    expires_at?: number | null
  }
}
type FailedResponse = {
  code: number
  message: string
  data: { login_fails: number }
}
type LoginResponse = SuccessfulResponse | FailedResponse

function isSuccessfulResponse(
  response: LoginResponse,
): response is SuccessfulResponse {
  return response.code === 0
}

const Login: React.FC = () => {
  const [identification, setIdentification] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [hasTooManyFails, setHasTooManyFails] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const captchaRef = useRef<CaptchaHandle | null>(null)
  const tooManyFails = useBlessingExtra<boolean>('tooManyFails', false)
  const history = useHistory()

  useEmitMounted()

  useEffect(() => {
    if (tooManyFails) {
      setHasTooManyFails(true)
    }
  }, [tooManyFails])

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleRememberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(event.target.checked)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)
    setWarningMessage('')

    const response = await fetch.post<LoginResponse>('/api/auth/login', {
      identification,
      password,
      keep: remember,
      ...(hasTooManyFails ? await captchaRef.current!.execute() : {}),
    })

    if (isSuccessfulResponse(response)) {
      // If the backend returned a token (stateless API login), save it
      if (response.data.token) {
        const expiresAt = response.data.expires_at
          ? response.data.expires_at * 1000
          : Date.now() + 365 * 24 * 3600 * 1000 // default 1 year for PAT
        saveToken({
          accessToken: response.data.token,
          refreshToken: '',
          expiresAt,
        })
        history.push('/user')
      } else {
        // Session-based login (server-rendered mode) — full page redirect
        window.location.href = response.data.redirectTo
      }
    } else {
      setWarningMessage(response.message)
      setIsPending(false)
      captchaRef.current?.reset()

      if (response.data?.login_fails > 3 && !hasTooManyFails) {
        setHasTooManyFails(true)
        showModal({
          mode: 'alert',
          text: t('auth.tooManyFails.captcha'),
        })
      }
    }
  }

  return (
    <AuthLayout title={t('auth.login')}>
      <form onSubmit={handleSubmit}>
        <EmailSuggestion
          type="text"
          placeholder={t('auth.identification')}
          required
          autoFocus
          value={identification}
          onChange={setIdentification}
        />
        <div className="input-group mb-3">
          <input
            type="password"
            className="form-control"
            placeholder={t('auth.password')}
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <div className="input-group-append">
            <div className="input-group-text">
              <i className="fas fa-lock"></i>
            </div>
          </div>
        </div>

        {hasTooManyFails && <Captcha ref={captchaRef} />}
        <Alert type="warning">{warningMessage}</Alert>

        <div className="d-flex justify-content-between mb-3">
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={remember}
              onChange={handleRememberChange}
            />
            {t('auth.keep')}
          </label>
          <Link to="/auth/forgot">{t('auth.forgot-link')}</Link>
        </div>

        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>
              {t('auth.loggingIn')}
            </>
          ) : (
            t('auth.login')
          )}
        </button>
      </form>

      <div className="mt-3 text-center">
        <Link to="/auth/register">{t('auth.register-link')}</Link>
      </div>
    </AuthLayout>
  )
}

export default Login
