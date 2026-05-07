import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { AppConfigProvider } from '@/contexts/AppConfig'
import { AuthProvider } from '@/auth/AuthContext'
import { MainLayout } from '@/layouts'
import CallbackPage from '@/views/auth/Callback'

const Dashboard = lazy(() => import('@/views/user/Dashboard'))
const Closet = lazy(() => import('@/views/user/Closet'))
const Players = lazy(() => import('@/views/user/Players'))
const OAuth = lazy(() => import('@/views/user/OAuth'))
const Login = lazy(() => import('@/views/auth/Login'))
const Register = lazy(() => import('@/views/auth/Registration'))
const Forgot = lazy(() => import('@/views/auth/Forgot'))
const Reset = lazy(() => import('@/views/auth/Reset'))
const SkinLibrary = lazy(() => import('@/views/skinlib/SkinLibrary'))
const Show = lazy(() => import('@/views/skinlib/Show'))
const Upload = lazy(() => import('@/views/skinlib/Upload'))
const UsersMgmt = lazy(() => import('@/views/admin/UsersManagement'))
const PlayersMgmt = lazy(() => import('@/views/admin/PlayersManagement'))
const ReportsMgmt = lazy(() => import('@/views/admin/ReportsManagement'))
const PluginsMgmt = lazy(() => import('@/views/admin/PluginsManagement'))
const PluginsMarket = lazy(() => import('@/views/admin/PluginsMarket'))
const Translations = lazy(() => import('@/views/admin/Translations'))

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

function App() {
  return (
    <AppConfigProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Switch>
              <Route path="/auth/callback" exact component={CallbackPage} />

              <Route path="/auth/login" exact component={Login} />
              <Route path="/auth/register">
                <MainLayout scope="user" title="Register">
                  <Register />
                </MainLayout>
              </Route>
              <Route path="/auth/forgot">
                <MainLayout scope="user" title="Forgot Password">
                  <Forgot />
                </MainLayout>
              </Route>
              <Route path="/auth/reset/:uid">
                <MainLayout scope="user" title="Reset Password">
                  <Reset />
                </MainLayout>
              </Route>

              <Route path="/user/closet">
                <MainLayout scope="user" title="My Closet">
                  <Closet />
                </MainLayout>
              </Route>
              <Route path="/user/player">
                <MainLayout scope="user" title="Player Management">
                  <Players />
                </MainLayout>
              </Route>
              <Route path="/user/oauth/manage">
                <MainLayout scope="user" title="OAuth Management">
                  <OAuth />
                </MainLayout>
              </Route>
              <Route path="/user">
                <MainLayout scope="user" title="Dashboard">
                  <Dashboard />
                </MainLayout>
              </Route>

              <Route path="/admin/users">
                <MainLayout scope="admin" title="User Management">
                  <UsersMgmt />
                </MainLayout>
              </Route>
              <Route path="/admin/players">
                <MainLayout scope="admin" title="Player Management">
                  <PlayersMgmt />
                </MainLayout>
              </Route>
              <Route path="/admin/reports">
                <MainLayout scope="admin" title="Report Management">
                  <ReportsMgmt />
                </MainLayout>
              </Route>
              <Route path="/admin/plugins/manage">
                <MainLayout scope="admin" title="Plugin Management">
                  <PluginsMgmt />
                </MainLayout>
              </Route>
              <Route path="/admin/plugins/market">
                <MainLayout scope="admin" title="Plugin Market">
                  <PluginsMarket />
                </MainLayout>
              </Route>
              <Route path="/admin/i18n">
                <MainLayout scope="admin" title="Translations">
                  <Translations />
                </MainLayout>
              </Route>
              <Route path="/admin">
                <MainLayout scope="admin" title="Admin Dashboard">
                  <Dashboard />
                </MainLayout>
              </Route>

              <Route path="/skinlib/show/:id">
                <MainLayout scope="user" title="Skin Details">
                  <Show />
                </MainLayout>
              </Route>
              <Route path="/skinlib/upload">
                <MainLayout scope="user" title="Upload Skin">
                  <Upload />
                </MainLayout>
              </Route>
              <Route path="/skinlib">
                <MainLayout scope="user" title="Skin Library">
                  <SkinLibrary />
                </MainLayout>
              </Route>

              <Route path="/" exact>
                <Redirect to="/user" />
              </Route>

              <Route path="*">
                <MainLayout scope="user" title="Page Not Found">
                  <div className="alert alert-warning">Page not found.</div>
                </MainLayout>
              </Route>
            </Switch>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </AppConfigProvider>
  )
}

export default App
