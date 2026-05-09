/** @jsxImportSource @emotion/react */
import * as React from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { t } from '@/scripts/i18n'
import { useBlessingExtra, useAppConfig } from '@/contexts/AppConfig'
import * as cssUtils from '@/styles/utils'

export interface CaptchaHandle {
  execute: () => Promise<string>
  reset: () => void
}

const Captcha = React.forwardRef<CaptchaHandle>((_props, ref) => {
  const { baseUrl } = useAppConfig()
  const sitekey = useBlessingExtra<string>('turnstile', '')
  const [value, setValue] = React.useState('')
  const [time, setTime] = React.useState(Date.now())
  const turnstileRef = React.useRef<TurnstileInstance>()

  React.useImperativeHandle(ref, () => ({
    execute: async () => {
      if (turnstileRef.current) {
        return turnstileRef.current.getResponsePromise()
      }
      return value
    },
    reset: () => {
      if (turnstileRef.current) {
        turnstileRef.current.reset()
      } else {
        setTime(Date.now())
      }
    },
  }))

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  const handleRefresh = () => {
    setTime(Date.now())
  }

  return sitekey ? (
    <div className="mb-2">
      <Turnstile ref={turnstileRef} siteKey={sitekey} />
    </div>
  ) : (
    <div className="d-flex">
      <div className="form-group mb-3 mr-2">
        <input
          type="text"
          className="form-control"
          placeholder={t('auth.captcha')}
          required
          value={value}
          onChange={handleValueChange}
        />
      </div>
      <img
        src={`${baseUrl}/auth/captcha?v=${time}`}
        alt={t('auth.captcha')}
        css={cssUtils.pointerCursor}
        height={34}
        title={t('auth.change-captcha')}
        onClick={handleRefresh}
      />
    </div>
  )
})

export default Captcha
