import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from './pkce'
import {
  saveToken,
  getAccessToken,
  clearToken,
  isAuthenticated,
} from './tokenStore'

let apiBase = process.env.REACT_APP_API_BASE || ''

export function setApiBase(base: string) {
  apiBase = base
}

async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    credentials: 'omit',
  })
}

export interface UserInfo {
  uid: number
  email: string
  nickname: string
  admin: boolean
  avatar: string
}

export async function fetchUser(): Promise<UserInfo | null> {
  if (!isAuthenticated()) return null
  try {
    const resp = await apiFetch('/api/user')
    if (!resp.ok) {
      clearToken()
      return null
    }
    const data = await resp.json()
    return data.data || data
  } catch {
    return null
  }
}

export async function login(): Promise<void> {
  const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID || ''
  const redirectUri = `${window.location.origin}/auth/callback`

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  sessionStorage.setItem('bs_pkce_verifier', verifier)
  sessionStorage.setItem('bs_pkce_state', state)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope:
      'User.Read Player.Read Player.ReadWrite Closet.Read Closet.ReadWrite',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })

  window.location.href = `${apiBase}/oauth/authorize?${params.toString()}`
}

export async function handleCallback(
  code: string,
  state: string,
): Promise<boolean> {
  const savedState = sessionStorage.getItem('bs_pkce_state')
  const verifier = sessionStorage.getItem('bs_pkce_verifier')

  sessionStorage.removeItem('bs_pkce_state')
  sessionStorage.removeItem('bs_pkce_verifier')

  if (state !== savedState || !verifier) {
    return false
  }

  const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID || ''
  const redirectUri = `${window.location.origin}/auth/callback`

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: verifier,
  })

  try {
    const resp = await apiFetch('/oauth/token', {
      method: 'POST',
      body: body.toString(),
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    })

    if (!resp.ok) return false

    const data = await resp.json()
    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000

    saveToken({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    })

    return true
  } catch {
    return false
  }
}

export function logout(): void {
  clearToken()
  window.location.href = '/'
}
