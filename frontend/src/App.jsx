import React, { Suspense, lazy } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import { Routes, Route } from 'react-router-dom'
import UserProvider from './context/UserContext.jsx'
import { Toaster } from 'react-hot-toast'
import AppRouteFallback from './components/AppRouteFallback.jsx'
import {
  loadAdminPage,
  loadDashboardPage,
  loadEditResume,
  loadPublicSharePage,
  loadResumeMarkdownPage,
  loadSettingsPage,
  loadShareManagementPage,
  loadTemplatesPage,
} from './utils/routeModules.js'

const Dashboard = lazy(loadDashboardPage)
const EditResume = lazy(loadEditResume)
const ResumeMarkdownPage = lazy(loadResumeMarkdownPage)
const ShareManagementPage = lazy(loadShareManagementPage)
const PublicSharePage = lazy(loadPublicSharePage)
const TemplatesPage = lazy(loadTemplatesPage)
const AdminPage = lazy(loadAdminPage)
const SettingsPage = lazy(loadSettingsPage)

const App = () => {
  return (
    <UserProvider>
      <Suspense fallback={<AppRouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resume/:id/markdown" element={<ResumeMarkdownPage />} />
          <Route path="/share" element={<ShareManagementPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/s/:slug" element={<PublicSharePage />} />
          <Route path="/resume/:id" element={<EditResume />} />
        </Routes>
      </Suspense>

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
