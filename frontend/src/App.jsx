import React from 'react'
import LandingPage from './pages/LandingPage.jsx'
import { Routes, Route } from 'react-router-dom'
import UserProvider from './context/UserContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EditResume from './components/EditResume.jsx'
import { Toaster } from 'react-hot-toast'



const App = () => {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume/:id" element={<EditResume />} />
      </Routes>

      <Toaster toastOptions={{
        className: 'toast-container',
        style: {
          fontSize: '13px'
        }
      }} />
    </UserProvider>
  )
}

export default App