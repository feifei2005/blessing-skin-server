import JQuery from 'jquery'
import { ModalOptions, ModalResult } from './components/Modal'
import { Toast } from './scripts/toast'

declare global {
  // eslint-disable-next-line no-redeclare
  let blessing: {
    base_url: string
    debug: boolean
    env: string
    locale: string
    site_name: string
    version: string
    route: string
    extra: any
    i18n: Record<string, any>

    fetch: {
      get(url: string, params?: Record<string, unknown>): Promise<any>
      post(url: string, data?: Record<string, unknown>): Promise<any>
      put(url: string, data?: Record<string, unknown>): Promise<any>
      del(url: string, data?: Record<string, unknown>): Promise<any>
    }

    event: {
      on(eventName: string, listener: CallableFunction): void
      emit(eventName: string, payload?: unknown): void
    }

    notify: {
      showModal(options?: ModalOptions): Promise<ModalResult>
      toast: Toast
    }

    t: (key: string, params?: Record<string, unknown>) => string
  }

  function trans(key: string): string
}
