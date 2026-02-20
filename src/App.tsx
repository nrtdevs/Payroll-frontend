import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BranchesPage from './pages/BranchesPage'
import DashboardLayout from './pages/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import PermissionsPage from './pages/PermissionsPage'
import RolesPage from './pages/RolesPage'
import UsersPage from './pages/UsersPage'

const hasAuthToken = (): boolean => {
  return Boolean(localStorage.getItem('auth_token'))
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  if (!hasAuthToken()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }: { children: ReactElement }) {
  if (hasAuthToken()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="branch" element={<BranchesPage />} />
        <Route path="role" element={<RolesPage />} />
        <Route path="user" element={<UsersPage />} />
        <Route path="permission" element={<PermissionsPage />} />
        <Route path="roles" element={<Navigate to="/role" replace />} />
        <Route path="users" element={<Navigate to="/user" replace />} />
        <Route path="permissions" element={<Navigate to="/permission" replace />} />
        <Route path="dashboard/role" element={<Navigate to="/role" replace />} />
        <Route path="dashboard/roles" element={<Navigate to="/role" replace />} />
        <Route path="dashboard/user" element={<Navigate to="/user" replace />} />
        <Route path="dashboard/users" element={<Navigate to="/user" replace />} />
        <Route path="dashboard/permission" element={<Navigate to="/permission" replace />} />
        <Route path="dashboard/permissions" element={<Navigate to="/permission" replace />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
