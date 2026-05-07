import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'

interface UpdateInfo {
  latest: string
  current: string
  error: string
  can_update: boolean
}

const UpdatePage: React.FC = () => {
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [message, setMessage] = useState('')

  const loadInfo = () => {
    setLoading(true)
    fetch
      .get<UpdateInfo>('/api/admin/update')
      .then((d) => {
        if (d && d.latest !== undefined) setInfo(d)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadInfo()
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    setMessage('')
    const { code, message: msg } = await fetch.post<fetch.ResponseBody>(
      '/api/admin/update/download',
    )
    setMessage(msg)
    if (code === 0) {
      loadInfo()
    }
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Version</h3>
          </div>
          <div className="card-body">
            {info ? (
              <>
                <dl className="row">
                  <dt className="col-sm-4">Current</dt>
                  <dd className="col-sm-8">{info.current}</dd>
                  <dt className="col-sm-4">Latest</dt>
                  <dd className="col-sm-8">{info.latest || 'Unknown'}</dd>
                </dl>
                {info.error && (
                  <div className="alert alert-warning">{info.error}</div>
                )}
                {info.can_update && (
                  <button
                    className="btn btn-success"
                    disabled={downloading}
                    onClick={handleDownload}
                  >
                    {downloading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-1" />
                        Downloading...
                      </>
                    ) : (
                      'Download Update'
                    )}
                  </button>
                )}
                {message && (
                  <div className="alert alert-info mt-2">{message}</div>
                )}
              </>
            ) : (
              <p className="text-muted">No update info available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdatePage
