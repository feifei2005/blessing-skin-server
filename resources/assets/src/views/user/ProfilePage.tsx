import React from 'react'
import { t } from '@/scripts/i18n'

const Profile: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('user.profile')}</h3>
      </div>
      <div className="card-body">
        <p>Profile settings will be available here.</p>
      </div>
    </div>
  )
}

export default Profile
