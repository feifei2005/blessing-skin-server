import './scripts/polyfill'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import $ from 'jquery'
import './scripts/app'
import App from './App'
import { setApiBase } from '@/auth/AuthService'

Object.assign(window, { React, ReactDOM, $ })

const entry = document.querySelector('[href="#launch-cli"]')
entry?.addEventListener('click', async () => {
  const { launch } = await import('./scripts/cli')
  launch()
})

const rootEl = document.getElementById('app-root')
if (rootEl) {
  async function bootstrap() {
    try {
      const resp = await fetch('/config.json')
      if (resp.ok) {
        const config = await resp.json()
        if (config.apiBase) {
          ;(window as any).__API_BASE__ = config.apiBase
          ;(window as any).blessing = (window as any).blessing || {}
          ;(window as any).blessing.base_url = config.apiBase
          setApiBase(config.apiBase)
        }
      }
    } catch (e) {
      // config.json 加载失败，SPA 将使用编译时的 API 地址或同源模式
      console.warn('[bootstrap] 加载 config.json 失败:', e)
    } finally {
      ReactDOM.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
        rootEl,
      )
    }
  }
  bootstrap()
}
