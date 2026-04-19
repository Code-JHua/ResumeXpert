import React, { useContext } from 'react'
import Navbar from './Navbar'
import { UserContext } from '../context/UserContext'

const DashboardLayout = ({ activeMenu, children }) => {

  const { user } = useContext(UserContext);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50'>
      <Navbar activeMenu={activeMenu} />
      {user && <div className='container mx-auto pt-28 pb-4'>{children}</div>}
    </div>
  )
}

export default DashboardLayout