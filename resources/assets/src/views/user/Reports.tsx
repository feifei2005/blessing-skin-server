import React from 'react'
import { t } from '@/scripts/i18n'

const Reports: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('user.reports')}</h3>
      </div>
      <div className="card-body">
        <p>Your submitted reports will be listed here.</p>
      </div>
    </div>
  )
}

export default Reports
