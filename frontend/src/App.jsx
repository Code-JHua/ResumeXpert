import React from 'react'
import LandingPage from './pages/LandingPage.jsx'
import { Routes, Route } from 'react-router-dom'
import UserProvider from './context/UserContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EditResume from './components/EditResume.jsx'
import { Toaster } from 'react-hot-toast'
import JobDescriptionsPage from './pages/JobDescriptionsPage.jsx'
import CoverLettersPage from './pages/CoverLettersPage.jsx'
import ApplicationsPage from './pages/ApplicationsPage.jsx'
import ImportsPage from './pages/ImportsPage.jsx'
import ResumeMarkdownPage from './pages/ResumeMarkdownPage.jsx'
import ShareManagementPage from './pages/ShareManagementPage.jsx'
import ImportConfirmPage from './pages/ImportConfirmPage.jsx'



const App = () => {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<JobDescriptionsPage />} />
        <Route path="/cover-letters" element={<CoverLettersPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/imports" element={<ImportsPage />} />
        <Route path="/imports/:id/confirm" element={<ImportConfirmPage />} />
        <Route path="/resume/:id/markdown" element={<ResumeMarkdownPage />} />
        <Route path="/share" element={<ShareManagementPage />} />
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
