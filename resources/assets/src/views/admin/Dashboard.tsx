import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { t } from '@/scripts/i18n'

interface ChartData {
  labels: string[]
  xAxis: string[]
  data: number[][]
}

interface DashboardSummary {
  users: number
  players: number
  textures: number
  storage: {
    bytes: number
    human: string
  }
}

interface DashboardResponse {
  code: number
  data: DashboardSummary
}

const AdminDashboard: React.FC = () => {
  const [chart, setChart] = useState<ChartData | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch.get<ChartData>('/api/admin/chart'),
      fetch.get<DashboardResponse>('/api/admin/dashboard'),
    ])
      .then(([chartData, dashboardData]) => {
        if (chartData && chartData.labels) setChart(chartData)
        if (dashboardData && dashboardData.data) setSummary(dashboardData.data)
      })
      .catch((e) => console.warn('[AdminDashboard] fetch failed:', e))
      .finally(() => setLoading(false))
  }, [])

  const maxData = chart
    ? Math.max(...chart.data.flat().filter((v) => v > 0), 1)
    : 1

  const statCards = [
    {
      label: t('admin.index.total-users'),
      value: summary?.users ?? '-',
      bg: 'bg-info',
      icon: 'fas fa-users',
    },
    {
      label: t('admin.index.total-players'),
      value: summary?.players ?? '-',
      bg: 'bg-success',
      icon: 'fas fa-gamepad',
    },
    {
      label: t('admin.index.total-textures'),
      value: summary?.textures ?? '-',
      bg: 'bg-warning',
      icon: 'fas fa-image',
    },
    {
      label: t('admin.index.disk-usage'),
      value: summary?.storage?.human ?? '-',
      bg: 'bg-danger',
      icon: 'fas fa-hdd',
    },
  ]

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('general.dashboard')}</h3>
          </div>
          <div className="card-body">
            <p>{t('admin.index.welcome')}</p>
          </div>
        </div>
      </div>

      {!loading && summary && (
        <div className="col-12">
          <div className="row">
            {statCards.map((stat) => (
              <div key={stat.label} className="col-lg-3 col-6">
                <div className={`small-box ${stat.bg}`}>
                  <div className="inner">
                    <h3>{stat.value}</h3>
                    <p>{stat.label}</p>
                  </div>
                  <div className="icon">
                    <i className={stat.icon}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && chart && (
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {t('admin.index.monthly-statistics')}
              </h3>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>{t('admin.index.day')}</th>
                      {chart.labels.map((label, i) => (
                        <th key={i}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.xAxis.map((day, di) => (
                      <tr key={di}>
                        <td>{day}</td>
                        {chart.data.map((series, si) => (
                          <td key={si}>
                            <div className="d-flex align-items-center">
                              <span className="mr-2">{series[di] || 0}</span>
                              <div
                                className="progress progress-xs flex-grow-1"
                                style={{ minWidth: '40px' }}
                              >
                                <div
                                  className="progress-bar"
                                  style={{
                                    width: `${
                                      ((series[di] || 0) / maxData) * 100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
