import './scripts/polyfill'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import $ from 'jquery'
import './scripts/app'
import App from './App'

Object.assign(window, { React, ReactDOM, $ })

const entry = document.querySelector('[href="#launch-cli"]')
entry?.addEventListener('click', async () => {
  const { launch } = await import('./scripts/cli')
  launch()
})

const rootEl = document.getElementById('app-root')
if (rootEl) {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    rootEl,
  )
}
