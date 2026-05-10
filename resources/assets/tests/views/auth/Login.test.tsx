import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { t } from '@/scripts/i18n'
import Login from '@/views/auth/Login'

const mockLogin = jest.fn()
jest.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, isAuth: false, loading: false }),
}))

test('render login page', () => {
  const { getByRole } = render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
  expect(getByRole('button', { name: t('auth.login') })).toBeInTheDocument()
})

test('click login triggers OAuth flow', () => {
  const { getByRole } = render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
  fireEvent.click(getByRole('button', { name: t('auth.login') }))
  expect(mockLogin).toBeCalled()
})
