import React from 'react'

const AdminDashboard: React.FC = () => {
  return (
    <div className="row">
      <div className="col-12">
        <div className="alert alert-info">
          <h5>
            <i className="icon fas fa-tachometer-alt mr-2"></i>Admin Dashboard
          </h5>
          <p>Welcome to the administration panel.</p>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
