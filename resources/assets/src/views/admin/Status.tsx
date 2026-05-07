import React from 'react'
import { t } from '@/scripts/i18n'

const Status: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('admin.status')}</h3>
      </div>
      <div className="card-body">
        <p>Server status information will be displayed here.</p>
      </div>
    </div>
  )
}

export default Status
