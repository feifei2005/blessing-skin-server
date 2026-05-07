import React from 'react'
import { t } from '@/scripts/i18n'

const ScoreOptions: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('admin.score')}</h3>
      </div>
      <div className="card-body">
        <p>Score system settings will be available here.</p>
      </div>
    </div>
  )
}

export default ScoreOptions
