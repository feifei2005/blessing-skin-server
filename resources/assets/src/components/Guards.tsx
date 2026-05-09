import React from 'react'
import { Route, Redirect, RouteProps } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { t } from '@/scripts/i18n'

function Loading() {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '200px' }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}

export function PrivateRoute({ children, ...rest }: RouteProps) {
  const { isAuth, loading } = useAuth()

  return (
    <Route
      {...rest}
      render={() => {
        if (loading) return <Loading />
        if (!isAuth) return <Redirect to="/auth/login" />
        return children
      }}
    />
  )
}

interface AdminRouteProps extends RouteProps {
  requiredPermission?: number
}

export function AdminRoute({
  children,
  requiredPermission = 1,
  ...rest
}: AdminRouteProps) {
  const { isAuth, user, loading } = useAuth()

  return (
    <Route
      {...rest}
      render={() => {
        if (loading) return <Loading />
        if (!isAuth) return <Redirect to="/auth/login" />
        if (!user?.admin)
          return (
            <div className="alert alert-danger m-3">
              {t('auth.check.admin')}
            </div>
          )
        if ((user?.permission ?? 0) < requiredPermission)
          return (
            <div className="alert alert-danger m-3">
              {t('auth.check.admin')}
            </div>
          )
        return children
      }}
    />
  )
}
