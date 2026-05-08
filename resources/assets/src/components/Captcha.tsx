/** @jsxImportSource @emotion/react */
import * as React from 'react'
import Reaptcha from 'reaptcha'
import { emit, on } from '@/scripts/event'
import { t } from '@/scripts/i18n'
import { useBlessingExtra } from '@/contexts/AppConfig'
import * as cssUtils from '@/styles/utils'

const eventId = Symbol()

export interface CaptchaHandle {
  execute: () => Promise<string>
  reset: () => void
}

const Captcha = React.forwardRef<CaptchaHandle>((_props, ref) => {
  const sitekey = useBlessingExtra<string>('recaptcha', '')
  const invisible = useBlessingExtra<boolean>('invisible', false)
  const [value, setValue] = React.useState('')
  const [time, setTime] = React.useState(Date.now())
  const reaptchaRef = React.useRef<Reaptcha | null>(null)

  React.useImperativeHandle(ref, () => ({
    execute: async () => {
      if (reaptchaRef.current && invisible) {
        return new Promise<string>((resolve) => {
          const off = on(eventId, (val: string) => {
            resolve(val)
            off()
          })
          reaptchaRef.current!.execute()
        })
      }
      return value
    },
    reset: () => {
      if (reaptchaRef.current) {
        reaptchaRef.current.reset()
      } else {
        setTime(Date.now())
      }
    },
  }))

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  const handleVerify = (val: string) => {
    emit(eventId, val)
    setValue(val)
  }

  const handleRefresh = () => {
    setTime(Date.now())
  }

  return sitekey ? (
    <div className="mb-2">
      <Reaptcha
        ref={reaptchaRef}
        sitekey={sitekey}
        size={invisible ? 'invisible' : 'normal'}
        onVerify={handleVerify}
      />
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
        src={`${blessing.base_url}/auth/captcha?v=${time}`}
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
