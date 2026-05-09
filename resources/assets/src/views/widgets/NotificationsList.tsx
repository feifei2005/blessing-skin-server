import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { showModal } from '@/scripts/notify'
import { t } from '@/scripts/i18n'
import { useAuth } from '@/auth/AuthContext'

export type Notification = {
  id: string
  title: string
}

const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { isAuth } = useAuth()

  useEffect(() => {
    if (!isAuth) return

    // 从 API 获取未读通知列表
    const fetchNotifications = async () => {
      try {
        const data = await fetch.get<Notification[]>('/api/user/notifications')
        if (Array.isArray(data)) {
          setNotifications(data)
        }
      } catch {
        // 获取通知失败时静默处理
      }
    }
    fetchNotifications()
  }, [isAuth])

  const read = async (id: string) => {
    const { title, content, time } = await fetch.post<{
      title: string
      content: string
      time: string
    }>(`/api/user/notifications/${id}`)

    showModal({
      mode: 'alert',
      title,
      children: (
        <>
          <div dangerouslySetInnerHTML={{ __html: content }}></div>
          <br />
          <small>{time}</small>
        </>
      ),
    })
    setNotifications((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    )
  }

  const hasUnread = notifications.length > 0

  return (
    <>
      <a className="nav-link" data-toggle="dropdown" href="#">
        <i className="far fa-bell"></i>
        {hasUnread && (
          <span className="badge badge-warning navbar-badge">
            {notifications.length}
          </span>
        )}
      </a>
      <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
        {hasUnread ? (
          notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <a
                href="#"
                className="dropdown-item"
                onClick={() => read(notification.id)}
              >
                <i className="far fa-circle text-info mr-2"></i>
                {notification.title}
              </a>
              <div className="dropdown-divider"></div>
            </React.Fragment>
          ))
        ) : (
          <p className="text-center text-muted pt-2 pb-2">
            {t('general.noResult')}
          </p>
        )}
      </div>
    </>
  )
}

export default NotificationsList
