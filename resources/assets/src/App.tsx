import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { AppConfigProvider } from '@/contexts/AppConfig'
import { AuthProvider } from '@/auth/AuthContext'
import { MainLayout, AuthLayout, SkinlibLayout } from '@/layouts'
import { PrivateRoute, AdminRoute } from '@/components/Guards'
import CallbackPage from '@/views/auth/Callback'

const Dashboard = lazy(() => import('@/views/user/Dashboard'))
const AdminDashboard = lazy(() => import('@/views/admin/Dashboard'))
const Closet = lazy(() => import('@/views/user/Closet'))
const Players = lazy(() => import('@/views/user/Players'))
const OAuth = lazy(() => import('@/views/user/OAuth'))
const Profile = lazy(() => import('@/views/user/ProfilePage'))
const Reports = lazy(() => import('@/views/user/Reports'))
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
const Customization = lazy(() => import('@/views/admin/CustomizationPage'))
const ScoreOptions = lazy(() => import('@/views/admin/ScoreOptions'))
const Options = lazy(() => import('@/views/admin/Options'))
const Resource = lazy(() => import('@/views/admin/Resource'))
const Status = lazy(() => import('@/views/admin/Status'))
const UpdatePage = lazy(() => import('@/views/admin/UpdatePage'))

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
                <AuthLayout title="Register">
                  <Register />
                </AuthLayout>
              </Route>
              <Route path="/auth/forgot">
                <AuthLayout title="Forgot Password">
                  <Forgot />
                </AuthLayout>
              </Route>
              <Route path="/auth/reset/:uid">
                <AuthLayout title="Reset Password">
                  <Reset />
                </AuthLayout>
              </Route>

              <PrivateRoute path="/user/closet">
                <MainLayout scope="user" title="My Closet">
                  <Closet />
                </MainLayout>
              </PrivateRoute>
              <PrivateRoute path="/user/player">
                <MainLayout scope="user" title="Player Management">
                  <Players />
                </MainLayout>
              </PrivateRoute>
              <PrivateRoute path="/user/oauth/manage">
                <MainLayout scope="user" title="OAuth Management">
                  <OAuth />
                </MainLayout>
              </PrivateRoute>
              <PrivateRoute path="/user/profile">
                <MainLayout scope="user" title="Profile">
                  <Profile />
                </MainLayout>
              </PrivateRoute>
              <PrivateRoute path="/user/reports">
                <MainLayout scope="user" title="My Reports">
                  <Reports />
                </MainLayout>
              </PrivateRoute>
              <PrivateRoute path="/user">
                <MainLayout scope="user" title="Dashboard">
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>

              <AdminRoute path="/admin/users">
                <MainLayout scope="admin" title="User Management">
                  <UsersMgmt />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/players">
                <MainLayout scope="admin" title="Player Management">
                  <PlayersMgmt />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/reports">
                <MainLayout scope="admin" title="Report Management">
                  <ReportsMgmt />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/plugins/manage">
                <MainLayout scope="admin" title="Plugin Management">
                  <PluginsMgmt />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/plugins/market">
                <MainLayout scope="admin" title="Plugin Market">
                  <PluginsMarket />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/i18n">
                <MainLayout scope="admin" title="Translations">
                  <Translations />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/customize">
                <MainLayout scope="admin" title="Customize">
                  <Customization />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/score">
                <MainLayout scope="admin" title="Score Options">
                  <ScoreOptions />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/options">
                <MainLayout scope="admin" title="Options">
                  <Options />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/resource">
                <MainLayout scope="admin" title="Resource Options">
                  <Resource />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/status">
                <MainLayout scope="admin" title="Status">
                  <Status />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin/update" requiredPermission={2}>
                <MainLayout scope="admin" title="Check Update">
                  <UpdatePage />
                </MainLayout>
              </AdminRoute>
              <AdminRoute path="/admin">
                <MainLayout scope="admin" title="Admin Dashboard">
                  <AdminDashboard />
                </MainLayout>
              </AdminRoute>

              <Route path="/skinlib/show/:id">
                <SkinlibLayout>
                  <Show />
                </SkinlibLayout>
              </Route>
              <Route path="/skinlib/upload">
                <SkinlibLayout>
                  <Upload />
                </SkinlibLayout>
              </Route>
              <Route path="/skinlib">
                <SkinlibLayout>
                  <SkinLibrary />
                </SkinlibLayout>
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
