import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { t } from '@/scripts/i18n'
import { AppConfigProvider } from '@/contexts/AppConfig'
import Captcha from '@/components/Captcha'

const mockTurnstile = {
  getResponsePromise: jest.fn().mockResolvedValue('token'),
  reset: jest.fn(),
}
jest.mock('@marsidev/react-turnstile', () => {
  const React = require('react')
  return {
    Turnstile: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => mockTurnstile)
      return <div data-testid="turnstile-mock" />
    }),
  }
})

describe('picture captcha', () => {
  it('retrieve value', async () => {
    const ref = React.createRef<Captcha>()
    const { getByPlaceholderText } = render(<Captcha ref={ref} />)

    fireEvent.input(getByPlaceholderText(t('auth.captcha')), {
      target: { value: 'abc' },
    })
    expect(await ref.current?.execute()).toBe('abc')
  })

  it('refresh on click', async () => {
    const spy = jest.spyOn(Date, 'now')

    const ref = React.createRef<Captcha>()
    const { getByAltText } = render(<Captcha ref={ref} />)

    fireEvent.click(getByAltText(t('auth.captcha')))
    expect(spy).toBeCalled()
  })

  it('refresh programatically', async () => {
    const spy = jest.spyOn(Date, 'now')

    const ref = React.createRef<Captcha>()
    render(<Captcha ref={ref} />)

    ref.current?.reset()
    expect(spy).toBeCalled()
  })
})

describe('turnstile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTurnstile.getResponsePromise.mockResolvedValue('token')
  })

  it('retrieve value', async () => {
    const ref = React.createRef<Captcha>()
    render(
      <AppConfigProvider config={{ extra: { turnstile: 'sitekey' } }}>
        <Captcha ref={ref} />
      </AppConfigProvider>,
    )

    const value = await ref.current?.execute()
    expect(mockTurnstile.getResponsePromise).toBeCalled()
    expect(value).toBe('token')
  })

  it('refresh programatically', async () => {
    const ref = React.createRef<Captcha>()
    render(
      <AppConfigProvider config={{ extra: { turnstile: 'sitekey' } }}>
        <Captcha ref={ref} />
      </AppConfigProvider>,
    )

    ref.current?.reset()
    expect(mockTurnstile.reset).toBeCalled()
  })
})
