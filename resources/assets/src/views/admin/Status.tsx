import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { t } from '@/scripts/i18n'

interface StatusDetail {
  bs: {
    version: string
    env: string
    debug: string
    commit: string
    laravel: string
  }
  server: {
    php: string
    web: string
    os: string
  }
  db: {
    type: string
    host: string
    port: string
    username: string
    database: string
    prefix: string
  }
}

interface Plugin {
  title: string
  version: string
}

interface StatusData {
  detail: StatusDetail
  plugins: Plugin[]
}

const Status: React.FC = () => {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch
      .get<StatusData>('/api/admin/status')
      .then((d) => {
        if (d && d.detail) setData(d)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  if (!data) {
    return <div className="alert alert-warning">Failed to load status.</div>
  }

  const { detail, plugins } = data

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('admin.status.bs.name')}</h3>
          </div>
          <div className="card-body p-0">
            <table className="table table-striped">
              <tbody>
                <tr>
                  <td>{t('admin.status.bs.version')}</td>
                  <td>{detail.bs.version}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.bs.env')}</td>
                  <td>{detail.bs.env}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.bs.debug')}</td>
                  <td>{detail.bs.debug}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.bs.commit')}</td>
                  <td>{detail.bs.commit}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.bs.laravel')}</td>
                  <td>{detail.bs.laravel}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('admin.status.server.name')}</h3>
          </div>
          <div className="card-body p-0">
            <table className="table table-striped">
              <tbody>
                <tr>
                  <td>{t('admin.status.server.php')}</td>
                  <td>{detail.server.php}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.server.web')}</td>
                  <td>{detail.server.web}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.server.os')}</td>
                  <td>{detail.server.os}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('admin.status.db.name')}</h3>
          </div>
          <div className="card-body p-0">
            <table className="table table-striped">
              <tbody>
                <tr>
                  <td>{t('admin.status.db.type')}</td>
                  <td>{detail.db.type}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.db.host')}</td>
                  <td>{detail.db.host}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.db.port')}</td>
                  <td>{detail.db.port}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.db.username')}</td>
                  <td>{detail.db.username}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.db.database')}</td>
                  <td>{detail.db.database}</td>
                </tr>
                <tr>
                  <td>{t('admin.status.db.prefix')}</td>
                  <td>{detail.db.prefix}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {t('admin.status.plugins', { amount: plugins.length })}
            </h3>
          </div>
          <div className="card-body p-0">
            {plugins.length === 0 ? (
              <p className="p-3 text-muted">No plugins enabled.</p>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Plugin</th>
                    <th>Version</th>
                  </tr>
                </thead>
                <tbody>
                  {plugins.map((p, i) => (
                    <tr key={i}>
                      <td>{p.title}</td>
                      <td>{p.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Status
