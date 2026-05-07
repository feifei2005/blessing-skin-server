import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { fetchUser, login, logout, UserInfo } from './AuthService'
import { isAuthenticated } from './tokenStore'

interface AuthContextType {
  isAuth: boolean
  user: UserInfo | null
  loading: boolean
  login: () => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuth: false,
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const userInfo = await fetchUser()
    if (userInfo) {
      setUser(userInfo)
      setIsAuth(true)
    } else {
      setUser(null)
      setIsAuth(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthenticated()) {
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [refreshUser])

  const handleLogout = useCallback(() => {
    setUser(null)
    setIsAuth(false)
    logout()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        user,
        loading,
        login,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
