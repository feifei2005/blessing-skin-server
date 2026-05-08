import React, { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import { t } from '@/scripts/i18n'

const ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth()
  const [tab, setTab] = useState('nickname')
  const [submitting, setSubmitting] = useState(false)

  // Nickname
  const [newNickname, setNewNickname] = useState('')
  const handleNickname = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNickname) return
    setSubmitting(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/user/profile',
      { action: 'nickname', new_nickname: newNickname },
    )
    toast[code === 0 ? 'success' : 'error'](message)
    if (code === 0) {
      setNewNickname('')
      refreshUser()
    }
    setSubmitting(false)
  }

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    setSubmitting(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/user/profile',
      {
        action: 'password',
        current_password: currentPassword,
        new_password: newPassword,
      },
    )
    toast[code === 0 ? 'success' : 'error'](message)
    if (code === 0) {
      setCurrentPassword('')
      setNewPassword('')
      logout()
    }
    setSubmitting(false)
  }

  // Email
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !emailPassword) return
    setSubmitting(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/user/profile',
      {
        action: 'email',
        email: newEmail,
        password: emailPassword,
      },
    )
    toast[code === 0 ? 'success' : 'error'](message)
    if (code === 0) {
      setNewEmail('')
      setEmailPassword('')
      logout()
    }
    setSubmitting(false)
  }

  // Avatar
  const [avatarTid, setAvatarTid] = useState('')
  const handleAvatar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarTid) return
    setSubmitting(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/user/profile/avatar',
      { tid: avatarTid },
    )
    toast[code === 0 ? 'success' : 'error'](message)
    if (code === 0) {
      setAvatarTid('')
      refreshUser()
    }
    setSubmitting(false)
  }

  // Delete account
  const [deletePassword, setDeletePassword] = useState('')
  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletePassword) return
    setSubmitting(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/user/profile',
      { action: 'delete', password: deletePassword },
    )
    if (code === 0) {
      logout()
    } else {
      toast.error(message)
    }
    setSubmitting(false)
  }

  if (!user) return null

  const tabs = [
    { key: 'nickname', label: t('user.profile.nickname.title') },
    { key: 'password', label: t('user.profile.password.title') },
    { key: 'email', label: t('user.profile.email.title') },
    { key: 'avatar', label: t('user.profile.avatar.title') },
    { key: 'delete', label: t('user.profile.delete.title') },
  ]

  return (
    <div className="row">
      <div className="col-md-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('general.profile')}</h3>
          </div>
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`list-group-item list-group-item-action ${
                    tab === t.key ? 'active' : ''
                  }`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-9">
        <div className="card">
          <div className="card-body">
            {tab === 'nickname' && (
              <form onSubmit={handleNickname}>
                <div className="form-group">
                  <label>
                    {t('user.profile.nickname.title')}: {user.nickname}
                  </label>
                  <input
                    className="form-control"
                    placeholder={t('user.profile.nickname.title')}
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <i className="fas fa-spinner fa-spin mr-1" />
                  ) : null}
                  {t('user.profile.nickname.success')}
                </button>
              </form>
            )}

            {tab === 'password' && (
              <form onSubmit={handlePassword}>
                <div className="form-group">
                  <label>{t('user.profile.password.old')}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={32}
                  />
                </div>
                <div className="form-group">
                  <label>{t('user.profile.password.new')}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={32}
                  />
                </div>
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <i className="fas fa-spinner fa-spin mr-1" />
                  ) : null}
                  {t('user.profile.password.button')}
                </button>
              </form>
            )}

            {tab === 'email' && (
              <form onSubmit={handleEmail}>
                <div className="form-group">
                  <label>
                    {t('user.profile.email.title')}:{' '}
                    {user.email || t('general.unknown')}
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder={t('user.profile.email.new')}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('user.profile.email.password')}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <i className="fas fa-spinner fa-spin mr-1" />
                  ) : null}
                  {t('user.profile.email.button')}
                </button>
              </form>
            )}

            {tab === 'avatar' && (
              <form onSubmit={handleAvatar}>
                <div className="form-group">
                  <label>{t('user.profile.avatar.notice')}</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder={t('user.profile.avatar.notice')}
                    value={avatarTid}
                    onChange={(e) => setAvatarTid(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <i className="fas fa-spinner fa-spin mr-1" />
                  ) : null}
                  {t('user.profile.avatar.title')}
                </button>
              </form>
            )}

            {tab === 'delete' && (
              <form onSubmit={handleDelete}>
                <div className="alert alert-danger">
                  {t('user.profile.delete.notice')}
                </div>
                <div className="form-group">
                  <label>{t('user.profile.delete.password')}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-danger" disabled={submitting}>
                  {submitting ? (
                    <i className="fas fa-spinner fa-spin mr-1" />
                  ) : null}
                  {t('user.profile.delete.button')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
