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
import LeaveRequestManagementPage from './pages/LeaveRequestManagementPage'
import SalaryManagementPage from './pages/SalaryManagementPage'
import SalaryComponentsPage from './pages/SalaryComponentsPage'
import SalaryStructuresPage from './pages/SalaryStructuresPage'
import EmployeeSalariesPage from './pages/EmployeeSalariesPage'
import SalaryBreakdownPage from './pages/SalaryBreakdownPage'
import PayrollPage from './pages/PayrollPage'
import PayrollRecordsPage from './pages/PayrollRecordsPage'
import SalarySlipPage from './pages/SalarySlipPage'
import MasterSettingPage from './pages/MasterSettingPage'
import OrganizationStructurePage from './pages/OrganizationStructurePage'
import SessionsPage from './pages/SessionsPage'
import UsersPage from './pages/UsersPage'
import HolidaysPage from './pages/HolidaysPage'
import CompanyPage from './pages/CompanyPage'

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
        <Route path="holiday" element={<HolidaysPage />} />
        <Route path="company" element={<CompanyPage />} />
        <Route path="employment-type" element={<Navigate to="/master-setting" replace />} />
        <Route path="master-setting" element={<MasterSettingPage />} />
        <Route path="organization-structure" element={<OrganizationStructurePage />} />
        <Route path="session" element={<SessionsPage />} />
        <Route path="sessions" element={<Navigate to="/session" replace />} />
        <Route path="leave-master" element={<LeaveManagementPage />} />
        <Route path="leave-management" element={<LeaveRequestManagementPage />} />
        <Route path="leave-requests" element={<Navigate to="/leave-management" replace />} />
        <Route path="salary-management" element={<SalaryManagementPage />} />
        <Route path="admin/salary-components" element={<SalaryComponentsPage />} />
        <Route path="admin/salary-structures" element={<SalaryStructuresPage />} />
        <Route path="admin/employee-salaries" element={<EmployeeSalariesPage />} />
        <Route path="admin/employee-salaries/:employeeId" element={<SalaryBreakdownPage />} />
        <Route path="admin/payroll" element={<PayrollPage />} />
        <Route path="admin/payroll-records" element={<PayrollRecordsPage />} />
        <Route path="admin/salary-slip" element={<SalarySlipPage />} />
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
        <Route path="dashboard/holiday" element={<Navigate to="/holiday" replace />} />
        <Route path="dashboard/company" element={<Navigate to="/company" replace />} />
        <Route path="employment-types" element={<Navigate to="/employment-type" replace />} />
        <Route path="dashboard/employment-type" element={<Navigate to="/employment-type" replace />} />
        <Route path="dashboard/employment-types" element={<Navigate to="/employment-type" replace />} />
        <Route path="dashboard/master-setting" element={<Navigate to="/master-setting" replace />} />
        <Route path="dashboard/organization-structure" element={<Navigate to="/organization-structure" replace />} />
        <Route path="dashboard/session" element={<Navigate to="/session" replace />} />
        <Route path="dashboard/sessions" element={<Navigate to="/session" replace />} />
        <Route path="dashboard/leave-master" element={<Navigate to="/leave-master" replace />} />
        <Route path="dashboard/leave-management" element={<Navigate to="/leave-management" replace />} />
        <Route path="dashboard/leave-requests" element={<Navigate to="/leave-management" replace />} />
        <Route path="dashboard/salary-management" element={<Navigate to="/salary-management" replace />} />
        <Route path="dashboard/admin/salary-components" element={<Navigate to="/admin/salary-components" replace />} />
        <Route path="dashboard/admin/salary-structures" element={<Navigate to="/admin/salary-structures" replace />} />
        <Route path="dashboard/admin/employee-salaries" element={<Navigate to="/admin/employee-salaries" replace />} />
        <Route path="dashboard/admin/employee-salaries/:employeeId" element={<Navigate to="/admin/employee-salaries" replace />} />
        <Route path="dashboard/admin/payroll" element={<Navigate to="/admin/payroll" replace />} />
        <Route path="dashboard/admin/payroll-records" element={<Navigate to="/admin/payroll-records" replace />} />
        <Route path="dashboard/admin/salary-slip" element={<Navigate to="/admin/salary-slip" replace />} />
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
