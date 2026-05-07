import React from 'react'
import { t } from '@/scripts/i18n'

const Customization: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('admin.customize')}</h3>
      </div>
      <div className="card-body">
        <p>Site customization settings will be available here.</p>
      </div>
    </div>
  )
}

export default Customization
