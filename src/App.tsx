import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BranchesPage from './pages/BranchesPage'
import AttendancePage from './pages/AttendancePage'
import DashboardLayout from './pages/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import PermissionsPage from './pages/PermissionsPage'
import ProfilePage from './pages/ProfilePage'
import RoleEditPage from './pages/RoleEditPage'
import RolesPage from './pages/RolesPage'
import LeaveManagementPage from './pages/LeaveManagementPage'
import SalaryManagementPage from './pages/SalaryManagementPage'
import MasterSettingPage from './pages/MasterSettingPage'
import OrganizationStructurePage from './pages/OrganizationStructurePage'
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
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="attendense" element={<Navigate to="/attendance" replace />} />
        <Route path="role" element={<RolesPage />} />
        <Route path="role-edit/:roleId" element={<RoleEditPage />} />
        <Route path="user" element={<UsersPage />} />
        <Route path="permission" element={<PermissionsPage />} />
        <Route path="employment-type" element={<Navigate to="/master-setting" replace />} />
        <Route path="master-setting" element={<MasterSettingPage />} />
        <Route path="organization-structure" element={<OrganizationStructurePage />} />
        <Route path="leave-master" element={<LeaveManagementPage />} />
        <Route path="leave-management" element={<Navigate to="/leave-master" replace />} />
        <Route path="salary-management" element={<SalaryManagementPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="roles" element={<Navigate to="/role" replace />} />
        <Route path="users" element={<Navigate to="/user" replace />} />
        <Route path="permissions" element={<Navigate to="/permission" replace />} />
        <Route path="dashboard/profile" element={<Navigate to="/profile" replace />} />
        <Route path="dashboard/role" element={<Navigate to="/role" replace />} />
        <Route path="dashboard/roles" element={<Navigate to="/role" replace />} />
        <Route path="dashboard/role-edit/:roleId" element={<RoleEditPage />} />
        <Route path="dashboard/user" element={<Navigate to="/user" replace />} />
        <Route path="dashboard/users" element={<Navigate to="/user" replace />} />
        <Route path="dashboard/permission" element={<Navigate to="/permission" replace />} />
        <Route path="dashboard/permissions" element={<Navigate to="/permission" replace />} />
        <Route path="employment-types" element={<Navigate to="/employment-type" replace />} />
        <Route path="dashboard/employment-type" element={<Navigate to="/employment-type" replace />} />
        <Route path="dashboard/employment-types" element={<Navigate to="/employment-type" replace />} />
        <Route path="dashboard/master-setting" element={<Navigate to="/master-setting" replace />} />
        <Route path="dashboard/organization-structure" element={<Navigate to="/organization-structure" replace />} />
        <Route path="dashboard/leave-master" element={<Navigate to="/leave-master" replace />} />
        <Route path="dashboard/leave-management" element={<Navigate to="/leave-master" replace />} />
        <Route path="dashboard/salary-management" element={<Navigate to="/salary-management" replace />} />
        <Route path="dashboard/attendance" element={<Navigate to="/attendance" replace />} />
        <Route path="dashboard/attendense" element={<Navigate to="/attendance" replace />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
