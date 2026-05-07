import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'

interface ChartData {
  labels: string[]
  xAxis: string[]
  data: number[][]
}

const AdminDashboard: React.FC = () => {
  const [chart, setChart] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch
      .get<ChartData>('/api/admin/chart')
      .then(setChart)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Dashboard</h3>
          </div>
          <div className="card-body">
            <p>Welcome to the administration panel.</p>
          </div>
        </div>
      </div>

      {!loading && chart && (
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Statistics</h3>
            </div>
            <div className="card-body p-0">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Day</th>
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
                        <td key={si}>{series[di] || 0}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
