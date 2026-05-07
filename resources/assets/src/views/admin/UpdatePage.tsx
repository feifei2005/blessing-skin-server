import React from 'react'
import { t } from '@/scripts/i18n'

const UpdatePage: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('admin.update')}</h3>
      </div>
      <div className="card-body">
        <p>Update check and download will be available here.</p>
      </div>
    </div>
  )
}

export default UpdatePage
