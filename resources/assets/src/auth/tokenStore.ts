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
