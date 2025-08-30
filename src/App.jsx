import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import './i18n' // Import i18n configuration
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Revenues from './pages/Revenues'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import AdminSettings from './pages/AdminSettings'
import Layout from './components/Layout'
import EnrollmentForm from './pages/EnrollmentForm';
import StudentsList from './pages/StudentList'

function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <LanguageProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/revenues" element={<Revenues />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin-settings" element={<AdminSettings />} />
          <Route path="/enrollment" element={<EnrollmentForm />} />
          <Route path="/students-list" element={<StudentsList />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </LanguageProvider>
  )
}

export default App 