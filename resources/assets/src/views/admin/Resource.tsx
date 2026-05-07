import React from 'react'
import { t } from '@/scripts/i18n'

const Resource: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('admin.resource')}</h3>
      </div>
      <div className="card-body">
        <p>Resource and storage options will be available here.</p>
      </div>
    </div>
  )
}

export default Resource
