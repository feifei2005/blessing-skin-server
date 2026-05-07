import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { t } from '@/scripts/i18n'

interface Report {
  id: number
  tid: number
  reporter: number
  reason: string
  report_at: string
  status: number
}

interface PaginatedData {
  data: Report[]
  current_page: number
  last_page: number
  total: number
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch
      .get<PaginatedData>('/api/user/reports', { page })
      .then((result) => {
        if (result && result.data) {
          setReports(result.data)
          setLastPage(result.last_page || 1)
        }
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('general.my-reports')}</h3>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="d-flex justify-content-center p-3">
            <div className="spinner-border" role="status" />
          </div>
        ) : reports.length === 0 ? (
          <p className="p-3 text-muted">You have not submitted any reports.</p>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Texture ID</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.tid}</td>
                  <td>{r.reason}</td>
                  <td>
                    {r.status === 0
                      ? 'Pending'
                      : r.status === 1
                      ? 'Resolved'
                      : 'Rejected'}
                  </td>
                  <td>{r.report_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {lastPage > 1 && (
        <div className="card-footer">
          <div className="btn-group">
            {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${
                  p === page ? 'btn-primary' : 'btn-outline-primary'
                }`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
