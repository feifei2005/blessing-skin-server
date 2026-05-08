import React from 'react'
import ReactDOM from 'react-dom'
import EmailVerification from '@/views/widgets/EmailVerification'

export function tryRenderEmailVerification() {
  const container = document.querySelector('#email-verification')
  if (blessing.extra.unverified && container) {
    ReactDOM.render(<EmailVerification />, container)
  }
}

const container = document.querySelector('#email-verification')
if (blessing.extra.unverified && container) {
  ReactDOM.render(<EmailVerification />, container)
}
