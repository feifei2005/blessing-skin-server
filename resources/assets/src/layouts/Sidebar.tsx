import React from 'react'
import { Link, NavLink, useRouteMatch } from 'react-router-dom'
import { useAppConfig } from '@/contexts/AppConfig'
import { t } from '@/scripts/i18n'

interface MenuItem {
  title: string
  link?: string
  icon: string
  children?: MenuItem[]
  exact?: boolean
}

const userMenu: MenuItem[] = [
  {
    title: 'general.dashboard',
    link: '/user',
    icon: 'fa-tachometer-alt',
    exact: true,
  },
  { title: 'general.my-closet', link: '/user/closet', icon: 'fa-star' },
  { title: 'general.player-manage', link: '/user/player', icon: 'fa-users' },
  { title: 'general.my-reports', link: '/user/reports', icon: 'fa-flag' },
  { title: 'general.profile', link: '/user/profile', icon: 'fa-user' },
  {
    title: 'general.developer',
    icon: 'fa-code-branch',
    children: [
      {
        title: 'general.oauth-manage',
        link: '/user/oauth/manage',
        icon: 'fa-feather-alt',
      },
    ],
  },
]

const adminMenu: MenuItem[] = [
  {
    title: 'general.dashboard',
    link: '/admin',
    icon: 'fa-tachometer-alt',
    exact: true,
  },
  { title: 'general.user-manage', link: '/admin/users', icon: 'fa-users' },
  {
    title: 'general.player-manage',
    link: '/admin/players',
    icon: 'fa-gamepad',
  },
  { title: 'general.report-manage', link: '/admin/reports', icon: 'fa-flag' },
  {
    title: 'general.customize',
    link: '/admin/customize',
    icon: 'fa-paint-brush',
  },
  { title: 'general.i18n', link: '/admin/i18n', icon: 'fa-globe' },
  {
    title: 'general.score-options',
    link: '/admin/score',
    icon: 'fa-credit-card',
  },
  { title: 'general.options', link: '/admin/options', icon: 'fa-cog' },
  { title: 'general.res-options', link: '/admin/resource', icon: 'fa-atom' },
  {
    title: 'general.status',
    link: '/admin/status',
    icon: 'fa-battery-three-quarters',
  },
  {
    title: 'general.plugin-manage',
    link: '/admin/plugins/manage',
    icon: 'fa-plug',
  },
  {
    title: 'general.plugin-market',
    link: '/admin/plugins/market',
    icon: 'fa-shopping-bag',
  },
  { title: 'general.check-update', link: '/admin/update', icon: 'fa-arrow-up' },
]

const exploreMenu: MenuItem[] = [
  {
    title: 'general.skinlib',
    link: '/skinlib',
    icon: 'fa-archive',
    exact: true,
  },
]

function SideMenuLink({ item }: { item: MenuItem }) {
  const link = item.link!
  const title = t(item.title)

  return (
    <NavLink
      to={link}
      className="nav-link"
      activeClassName="active"
      exact={item.exact}
    >
      <i className={`nav-icon fas ${item.icon}`}></i>
      <p className="ml-1">{title}</p>
    </NavLink>
  )
}

function SideMenuItem({ item }: { item: MenuItem }) {
  if (item.children && item.children.length > 0) {
    return (
      <li className="nav-item has-treeview">
        <a href="#" className="nav-link" data-widget="treeview">
          <i className={`nav-icon fas ${item.icon}`}></i>
          <p className="ml-1">
            {t(item.title)}
            <i className="right fas fa-angle-left"></i>
          </p>
        </a>
        <ul className="nav nav-treeview">
          {item.children.map((child, i) => (
            <li key={i} className="nav-item">
              <SideMenuLink item={child} />
            </li>
          ))}
        </ul>
      </li>
    )
  }

  return (
    <li className="nav-item">
      <SideMenuLink item={item} />
    </li>
  )
}

interface SidebarProps {
  scope: 'user' | 'admin'
}

export function Sidebar({ scope }: SidebarProps) {
  const { siteName } = useAppConfig()

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-3">
      <Link to="/" className="brand-link text-center">
        <span className="brand-text font-weight-light">
          {siteName || 'Blessing Skin'}
        </span>
      </Link>
      <div className="sidebar">
        <nav className="mt-2">
          <ul
            className="nav nav-pills nav-sidebar flex-column nav-child-indent"
            data-widget="treeview"
            role="menu"
          >
            {scope === 'user' && (
              <>
                <li className="nav-header">{t('general.user-center')}</li>
                {userMenu.map((item, i) => (
                  <SideMenuItem key={i} item={item} />
                ))}
                <li className="nav-header">{t('general.explore')}</li>
                {exploreMenu.map((item, i) => (
                  <SideMenuItem key={i} item={item} />
                ))}
                <li className="nav-header">{t('general.manage')}</li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/admin"
                    activeClassName="active"
                    exact
                  >
                    <i className="nav-icon fas fa-cog"></i>
                    <p>{t('general.admin-panel')}</p>
                  </NavLink>
                </li>
              </>
            )}

            {scope === 'admin' && (
              <>
                <li className="nav-header">{t('general.admin-panel')}</li>
                {adminMenu.map((item, i) => (
                  <SideMenuItem key={i} item={item} />
                ))}
                <li className="nav-header">{t('general.back')}</li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/user"
                    activeClassName="active"
                    exact
                  >
                    <i className="nav-icon fas fa-user"></i>&nbsp;
                    <p>{t('general.user-center')}</p>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/skinlib"
                    activeClassName="active"
                    exact
                  >
                    <i className="nav-icon fas fa-archive"></i>&nbsp;
                    <p>{t('general.skinlib')}</p>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
