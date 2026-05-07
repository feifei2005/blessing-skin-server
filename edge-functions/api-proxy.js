// EdgeOne Edge Function: API Proxy
// This function proxies /api/* and /oauth/* requests to the PHP backend server.
// Deploy this as an Edge Function in EdgeOne Pages.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const apiBase = env.API_BASE_URL || 'https://your-cvm-server.com'

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
          'Access-Control-Allow-Methods':
            'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Proxy /api/* requests to the PHP backend
    if (url.pathname.startsWith('/api/')) {
      const targetUrl = `${apiBase}${url.pathname}${url.search}`

      const headers = new Headers(request.headers)
      headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''))

      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body:
          request.method !== 'GET' && request.method !== 'HEAD'
            ? request.body
            : undefined,
      })

      const newHeaders = new Headers(response.headers)
      newHeaders.set(
        'Access-Control-Allow-Origin',
        request.headers.get('Origin') || '*',
      )
      newHeaders.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      )
      newHeaders.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      )
      newHeaders.set('Access-Control-Allow-Credentials', 'true')

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    }

    // Proxy /oauth/* requests to the PHP backend
    if (url.pathname.startsWith('/oauth/')) {
      const targetUrl = `${apiBase}${url.pathname}${url.search}`

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body:
          request.method !== 'GET' && request.method !== 'HEAD'
            ? request.body
            : undefined,
        redirect: 'manual',
      })

      // Rewrite redirect Location from backend URL to EdgeOne origin
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location')
        if (location) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Location', location.replace(apiBase, url.origin))
          return new Response(response.body, {
            status: response.status,
            headers: newHeaders,
          })
        }
      }

      const newHeaders = new Headers(response.headers)
      newHeaders.set(
        'Access-Control-Allow-Origin',
        request.headers.get('Origin') || '*',
      )
      newHeaders.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      )
      newHeaders.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      )
      newHeaders.set('Access-Control-Allow-Credentials', 'true')

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    }

    // For all other requests, let EdgeOne serve static files
    return env.ASSETS.fetch(request)
  },
}
