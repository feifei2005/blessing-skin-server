import React from 'react'
import { t } from '@/scripts/i18n'

const Options: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('admin.options')}</h3>
      </div>
      <div className="card-body">
        <p>General site options will be available here.</p>
      </div>
    </div>
  )
}

export default Options
