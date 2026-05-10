import React from 'react'
import { waitFor, fireEvent } from '@testing-library/react'
import { renderWithRouter } from '../../testHelpers'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import urls from '@/scripts/urls'
import Reset from '@/views/auth/Reset'

jest.mock('@/scripts/net')

test('confirmation is not matched', () => {
  const { getByText, getByPlaceholderText, queryByText } = renderWithRouter(
    <Reset />,
    { route: '/auth/reset/1', path: '/auth/reset/:uid' },
  )

  fireEvent.input(getByPlaceholderText(t('auth.password')), {
    target: { value: 'password' },
  })
  fireEvent.input(getByPlaceholderText(t('auth.repeat-pwd')), {
    target: { value: 'password1' },
  })
  fireEvent.click(getByText(t('auth.reset')))

  expect(queryByText(t('auth.invalidConfirmPwd'))).toBeInTheDocument()
  expect(fetch.post).not.toBeCalled()
})

test('succeeded', async () => {
  fetch.post.mockResolvedValue({ code: 0, message: 'ok' })
  const { getByText, getByPlaceholderText, getByRole, queryByText } =
    renderWithRouter(<Reset />, {
      route: '/auth/reset/1',
      path: '/auth/reset/:uid',
    })

  fireEvent.input(getByPlaceholderText(t('auth.password')), {
    target: { value: 'password' },
  })
  fireEvent.input(getByPlaceholderText(t('auth.repeat-pwd')), {
    target: { value: 'password' },
  })
  fireEvent.click(getByText(t('auth.reset')))
  await waitFor(() =>
    expect(fetch.post).toBeCalledWith(urls.auth.reset(1), {
      password: 'password',
    }),
  )
  expect(queryByText('ok')).toBeInTheDocument()
  expect(getByRole('status')).toHaveClass('alert-success')
  jest.runAllTimers()
})

test('failed', async () => {
  fetch.post.mockResolvedValue({ code: 1, message: 'failed' })
  const { getByText, getByPlaceholderText, queryByText } = renderWithRouter(
    <Reset />,
    { route: '/auth/reset/1', path: '/auth/reset/:uid' },
  )

  fireEvent.input(getByPlaceholderText(t('auth.password')), {
    target: { value: 'password' },
  })
  fireEvent.input(getByPlaceholderText(t('auth.repeat-pwd')), {
    target: { value: 'password' },
  })
  fireEvent.click(getByText(t('auth.reset')))
  await waitFor(() =>
    expect(fetch.post).toBeCalledWith(urls.auth.reset(1), {
      password: 'password',
    }),
  )
  expect(queryByText('failed')).toBeInTheDocument()
})
