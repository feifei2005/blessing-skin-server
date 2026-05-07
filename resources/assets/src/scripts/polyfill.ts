// Polyfill the blessing global that PHP normally injects.
// In the SPA mode, this provides defaults that will be overridden
// by the AppConfig context.

;(window as any).blessing = {
  base_url: process.env.REACT_APP_API_BASE || '',
  debug: false,
  env: 'production',
  locale: 'en',
  site_name: 'Blessing Skin',
  extra: {},
  i18n: {},
  fetch: {
    get: () => Promise.resolve({}),
    post: () => Promise.resolve({}),
    put: () => Promise.resolve({}),
    del: () => Promise.resolve({}),
  },
  event: {
    on: () => {},
    emit: () => {},
  },
  notify: {
    showModal: () => Promise.resolve({}),
    toast: {
      success: () => {},
      info: () => {},
      warning: () => {},
      error: () => {},
    },
  },
  t: (key: string) => key,
}
