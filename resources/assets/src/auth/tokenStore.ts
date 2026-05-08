interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

const TOKEN_KEY = 'bs_auth_token'

export function saveToken(data: TokenData): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
}

export function getToken(): TokenData | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TokenData
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  const token = getToken()
  if (!token) return null
  if (Date.now() >= token.expiresAt) {
    return null
  }
  return token.accessToken
}

export function getRefreshToken(): string | null {
  const token = getToken()
  if (!token) return null
  return token.refreshToken || null
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

export function getIsRefreshing(): boolean {
  return isRefreshing
}

export function getRefreshPromise(): Promise<boolean> | null {
  return refreshPromise
}

export async function refreshAccessToken(apiBase: string): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  const clientId =
    (window as any).__OAUTH_CLIENT_ID__ ||
    process.env.REACT_APP_OAUTH_CLIENT_ID ||
    ''

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const resp = await fetch(`${apiBase}/oauth/token`, {
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
    } finally {
      isRefreshing = false
    }
  })()

  return refreshPromise
}
