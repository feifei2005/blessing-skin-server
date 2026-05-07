import { emit } from './event'
import { showModal } from './notify'
import { t } from './i18n'
import {
  getAccessToken,
  getRefreshToken,
  saveToken,
  clearToken,
} from '@/auth/tokenStore'

export interface ResponseBody<T = null> {
  code: number
  message: string
  data: T extends null ? never : T
}

class HTTPError extends Error {
  response: Response

  constructor(message: string, response: Response) {
    super(message)
    this.response = response
  }
}

function getBaseUrl(): string {
  return process.env.REACT_APP_API_BASE || blessing.base_url || ''
}

function retrieveToken(): string {
  const bearer = getAccessToken()
  if (bearer) {
    return `Bearer ${bearer}`
  }
  const csrfField = document.querySelector<HTMLMetaElement>(
    'meta[name="csrf-token"]',
  )
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return csrfField?.content || ''
}

const empty = Object.create(null)
function createInit(): RequestInit {
  return {
    credentials: 'omit',
    headers: new Headers({
      Accept: 'application/json',
    }),
  }
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  const clientId =
    (window as any).__OAUTH_CLIENT_ID__ ||
    process.env.REACT_APP_OAUTH_CLIENT_ID ||
    ''
  const baseUrl = getBaseUrl()

  try {
    const resp = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      }),
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      }).toString(),
      credentials: 'omit',
    })

    if (!resp.ok) {
      clearToken()
      return false
    }

    const data = await resp.json()
    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000

    saveToken({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt,
    })

    return true
  } catch {
    return false
  }
}

export async function walkFetch(
  request: Request,
  retryCount = 0,
): Promise<any> {
  // Proactive token refresh: if access token expired but refresh token exists
  if (!getAccessToken() && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false
      })
    }
    await refreshPromise
  }

  const token = retrieveToken()
  if (token) {
    if (token.startsWith('Bearer ')) {
      request.headers.set('Authorization', token)
    } else {
      request.headers.set('X-CSRF-TOKEN', token)
    }
  }

  try {
    const retryClone = getRefreshToken() ? request.clone() : null
    const response = await fetch(request)
    const cloned = response.clone()
    const contentType = response.headers.get('Content-Type') || ''
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text()
    if (response.ok) {
      return body
    }
    let message: string = body.message

    if (response.status === 422) {
      const {
        errors,
      }: {
        message: string
        errors: { [field: string]: string[] }
      } = body
      return {
        code: 1,
        message: Object.keys(errors).map((field) => errors[field]![0])[0],
      }
    } else if (response.status === 419) {
      return showModal({
        mode: 'alert',
        text: t('general.csrf'),
      })
    } else if (response.status === 401) {
      if (getRefreshToken() && retryCount < 1) {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = refreshAccessToken().finally(() => {
            isRefreshing = false
          })
        }
        const refreshed = await refreshPromise
        if (refreshed) {
          const newToken = getAccessToken()
          if (newToken && retryClone) {
            retryClone.headers.set('Authorization', `Bearer ${newToken}`)
            return walkFetch(retryClone, retryCount + 1)
          }
        }
      }
      clearToken()
      return showModal({
        mode: 'alert',
        text: message || t('general.fatalError'),
        type: 'warning',
      })
    } else if (response.status === 403 || response.status === 400) {
      return showModal({
        mode: 'alert',
        text: message,
        type: 'warning',
      })
    }

    if (body.exception && Array.isArray(body.trace)) {
      const trace = (body.trace as Array<{ file: string; line: number }>)
        .map((t, i) => `[${i + 1}] ${t.file}#L${t.line}`)
        .join('<br>')
      message = `${message}<br><details>${trace}</details>`
    }

    throw new HTTPError(message || body, cloned)
  } catch (error: any) {
    emit('fetchError', error)
    await showModal({
      mode: 'alert',
      title: t('general.fatalError'),
      dangerousHTML: error.message,
      type: 'danger',
      okButtonType: 'outline-light',
    })

    return { code: -1, message: t('general.fatalError') }
  }
}

export function get<T = any>(url: string, params = empty): Promise<T> {
  emit('beforeFetch', {
    method: 'GET',
    url,
    data: params,
  })

  const qs = new URLSearchParams(params).toString()
  const baseUrl = getBaseUrl()

  return walkFetch(new Request(`${baseUrl}${url}?${qs}`, createInit()))
}

function nonGet<T = any>(
  method: string,
  url: string,
  data?: FormData | Record<string, unknown>,
): Promise<T> {
  emit('beforeFetch', {
    method: method.toUpperCase(),
    url,
    data,
  })

  const baseUrl = getBaseUrl()
  const request = new Request(`${baseUrl}${url}`, {
    body: data instanceof FormData ? data : JSON.stringify(data),
    method: method.toUpperCase(),
    ...createInit(),
  })
  if (!(data instanceof FormData)) {
    request.headers.set('Content-Type', 'application/json')
  }

  return walkFetch(request)
}

export function post<T = any>(
  url: string,
  data?: FormData | Record<string, unknown>,
): Promise<T> {
  return nonGet<T>('POST', url, data)
}

export function put<T = any>(
  url: string,
  data?: FormData | Record<string, unknown>,
): Promise<T> {
  return nonGet<T>('PUT', url, data)
}

export function del<T = any>(
  url: string,
  data?: FormData | Record<string, unknown>,
): Promise<T> {
  return nonGet<T>('DELETE', url, data)
}

blessing.fetch = {
  get,
  post,
  put,
  del,
}
