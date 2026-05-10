import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import NotificationsList, {
  Notification,
} from '@/views/widgets/NotificationsList'

jest.mock('@/scripts/net')
jest.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ isAuth: true }),
}))

beforeEach(() => {
  document.body.innerHTML = ''
})

test('should not throw if element does not exist', () => {
  render(<NotificationsList />)
})

test('no unread notifications', async () => {
  fetch.get.mockResolvedValue([])

  const { queryByText } = render(<NotificationsList />)
  await waitFor(() =>
    expect(fetch.get).toBeCalledWith('/api/user/notifications'),
  )
  expect(queryByText(t('general.noResult'))).toBeInTheDocument()
})

test('with unread notifications', async () => {
  fetch.get.mockResolvedValue([{ id: '1', title: 'hi' }])

  const { queryByText } = render(<NotificationsList />)
  await waitFor(() =>
    expect(fetch.get).toBeCalledWith('/api/user/notifications'),
  )

  expect(queryByText('1')).toBeInTheDocument()
  expect(queryByText('hi')).toBeInTheDocument()
})

test('read notification', async () => {
  fetch.get.mockResolvedValue([{ id: '1', title: 'hi' }])
  fetch.post.mockResolvedValue({
    title: 'hi - title',
    content: 'content',
    time: '12:00',
  })

  const { getByText, queryByText } = render(<NotificationsList />)
  await waitFor(() =>
    expect(fetch.get).toBeCalledWith('/api/user/notifications'),
  )

  fireEvent.click(getByText('hi'))
  await waitFor(() =>
    expect(fetch.post).toBeCalledWith('/api/user/notifications/1'),
  )

  expect(queryByText('hi - title')).toBeInTheDocument()
  expect(queryByText('content')).toBeInTheDocument()
  expect(queryByText('12:00')).toBeInTheDocument()

  fireEvent.click(getByText(t('general.confirm')))
})
