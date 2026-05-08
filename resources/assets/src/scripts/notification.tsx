import React from 'react'
import ReactDOM from 'react-dom'
import NotificationsList from '@/views/widgets/NotificationsList'

if (!document.getElementById('app-root')) {
  const container = document.querySelector('[data-notifications]')
  if (container) {
    ReactDOM.render(<NotificationsList />, container)
  }
}
