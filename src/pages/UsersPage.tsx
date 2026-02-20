import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { branchService } from '../services/branchService'
import { roleService } from '../services/roleService'
import { userService } from '../services/userService'
import type { Branch } from '../services/branchService'
import type { Role } from '../services/roleService'
import type { CreateUserPayload, User, UserPayload } from '../services/userService'
import CustomAutocomplete, { type CustomAutocompleteOption } from '../components/CustomAutocomplete'
import CustomInput from '../components/CustomInput'

const emptyUserForm: CreateUserPayload = {
  name: '',
  branch_id: null,
  role_id: null,
  salary_type: 'MONTHLY',
  salary: null,
  leave_balance: null,
  status: 'ACTIVE',
  current_address: '',
  home_address: '',
  pan: '',
  aadhaar: '',
  mobile: '',
  number: '',
  email: '',
  password: '',
  father_name: '',
  mother_name: '',
  business_id: null,
}

const toNullableNumber = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')
  const [submittingUser, setSubmittingUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [userForm, setUserForm] = useState<CreateUserPayload>(emptyUserForm)

  const branchOptions: CustomAutocompleteOption<number>[] = branches.map((branch) => ({
    label: `${branch.name} (#${branch.id})`,
    value: branch.id,
  }))
  const roleOptions: CustomAutocompleteOption<number>[] = roles.map((role) => ({
    label: `${role.name} (#${role.id})`,
    value: role.id,
  }))
  const statusOptions: CustomAutocompleteOption<'ACTIVE' | 'INACTIVE'>[] = [
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'INACTIVE', value: 'INACTIVE' },
  ]

  const loadUsers = async () => {
    setLoadingUsers(true)
    setUserError('')
    try {
      const data = await userService.getUsers()
      setUsers(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users.'
      setUserError(message)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadFormOptions = async () => {
    try {
      const [branchData, roleData] = await Promise.all([branchService.getBranches(), roleService.getRoles()])
      setBranches(branchData)
      setRoles(roleData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load branch/role options.'
      setUserError(message)
    }
  }

  useEffect(() => {
    void loadUsers()
    void loadFormOptions()
  }, [])

  const closeCreateModal = () => {
    setCreateOpen(false)
    setUserForm(emptyUserForm)
  }

  const closeEditModal = () => {
    setEditOpen(false)
    setEditingUserId(null)
    setUserForm(emptyUserForm)
  }

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingUser(true)
    setUserError('')
    try {
      await userService.createUser(userForm)
      closeCreateModal()
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user.'
      setUserError(message)
    } finally {
      setSubmittingUser(false)
    }
  }

  const onEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingUserId === null) return
    setSubmittingUser(true)
    setUserError('')
    try {
      const updatePayload: UserPayload = {
        name: userForm.name,
        branch_id: userForm.branch_id,
        role_id: userForm.role_id,
        salary_type: userForm.salary_type,
        salary: userForm.salary,
        leave_balance: userForm.leave_balance,
        status: userForm.status,
        current_address: userForm.current_address,
        home_address: userForm.home_address,
        pan: userForm.pan,
        aadhaar: userForm.aadhaar,
        mobile: userForm.mobile,
        number: userForm.number,
        email: userForm.email,
        father_name: userForm.father_name,
        mother_name: userForm.mother_name,
        business_id: userForm.business_id,
      }
      await userService.updateUser(editingUserId, updatePayload)
      closeEditModal()
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user.'
      setUserError(message)
    } finally {
      setSubmittingUser(false)
    }
  }

  const onEditUser = (user: User) => {
    setEditingUserId(user.id)
    setUserForm({
      name: user.name || '',
      branch_id: user.branch_id ?? null,
      role_id: user.role_id ?? null,
      salary_type: user.salary_type || 'MONTHLY',
      salary: user.salary !== null && user.salary !== undefined ? Number(user.salary) : null,
      leave_balance: user.leave_balance ?? null,
      status: user.status || 'ACTIVE',
      current_address: user.current_address || '',
      home_address: user.home_address || '',
      pan: user.pan || '',
      aadhaar: user.aadhaar || '',
      mobile: user.mobile || '',
      number: user.number || '',
      email: user.email || '',
      password: '',
      father_name: user.father_name || '',
      mother_name: user.mother_name || '',
      business_id: user.business_id ?? null,
    })
    setEditOpen(true)
  }

  const onDeleteUser = async (user: User) => {
    const approved = window.confirm(`Delete user "${user.username || user.email || user.id}"?`)
    if (!approved) return

    setUserError('')
    try {
      await userService.deleteUser(user.id)
      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
        setViewOpen(false)
      }
      await loadUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user.'
      setUserError(message)
    }
  }

  const userFormFields = (includePassword: boolean) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <CustomInput label="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} required />
      <CustomAutocomplete
        label="Branch"
        required
        requiredMessage="Branch is required."
        options={branchOptions}
        value={userForm.branch_id}
        onChange={(nextValue) => setUserForm((p) => ({ ...p, branch_id: nextValue }))}
      />
      <CustomAutocomplete
        label="Role"
        required
        requiredMessage="Role is required."
        options={roleOptions}
        value={userForm.role_id}
        onChange={(nextValue) => setUserForm((p) => ({ ...p, role_id: nextValue }))}
      />
      <CustomAutocomplete
        label="Status"
        required
        requiredMessage="Status is required."
        options={statusOptions}
        value={userForm.status as 'ACTIVE' | 'INACTIVE'}
        onChange={(nextValue) => setUserForm((p) => ({ ...p, status: nextValue ?? 'ACTIVE' }))}
      />
      <CustomInput
        label="Salary Type"
        value={userForm.salary_type}
        onChange={(e) => setUserForm((p) => ({ ...p, salary_type: e.target.value }))}
        required
      />
      <CustomInput
        label="Salary"
        type="number"
        value={userForm.salary ?? ''}
        onChange={(e) => setUserForm((p) => ({ ...p, salary: toNullableNumber(e.target.value) }))}
        required
      />
      <CustomInput
        label="Leave Balance"
        type="number"
        value={userForm.leave_balance ?? ''}
        onChange={(e) => setUserForm((p) => ({ ...p, leave_balance: toNullableNumber(e.target.value) }))}
        required
      />
      <CustomInput
        label="Business ID"
        type="number"
        value={userForm.business_id ?? ''}
        onChange={(e) => setUserForm((p) => ({ ...p, business_id: toNullableNumber(e.target.value) }))}
        required
      />
      <CustomInput label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} required />
      {includePassword ? (
        <CustomInput
          label="Password"
          type="password"
          value={userForm.password}
          onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
          required
        />
      ) : null}
      <CustomInput label="Mobile" value={userForm.mobile} onChange={(e) => setUserForm((p) => ({ ...p, mobile: e.target.value }))} required />
      <CustomInput label="Number" value={userForm.number} onChange={(e) => setUserForm((p) => ({ ...p, number: e.target.value }))} required />
      <CustomInput label="PAN" value={userForm.pan} onChange={(e) => setUserForm((p) => ({ ...p, pan: e.target.value }))} required />
      <CustomInput label="Aadhaar" value={userForm.aadhaar} onChange={(e) => setUserForm((p) => ({ ...p, aadhaar: e.target.value }))} required />
      <CustomInput
        label="Father Name"
        value={userForm.father_name}
        onChange={(e) => setUserForm((p) => ({ ...p, father_name: e.target.value }))}
        required
      />
      <CustomInput
        label="Mother Name"
        value={userForm.mother_name}
        onChange={(e) => setUserForm((p) => ({ ...p, mother_name: e.target.value }))}
        required
      />
      <CustomInput
        label="Current Address"
        value={userForm.current_address}
        onChange={(e) => setUserForm((p) => ({ ...p, current_address: e.target.value }))}
        required
      />
      <CustomInput
        label="Home Address"
        value={userForm.home_address}
        onChange={(e) => setUserForm((p) => ({ ...p, home_address: e.target.value }))}
        required
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              User List
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create User
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadUsers()} disabled={loadingUsers}>
                Refresh
              </Button>
            </Stack>
          </Stack>

          {userError ? (
            <Alert severity="error" className="!mt-3">
              {userError}
            </Alert>
          ) : null}

          <TableContainer className="app-scrollbar !mt-4 !overflow-x-auto">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 && !loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={7}>No users found.</TableCell>
                  </TableRow>
                ) : null}
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</TableCell>
                    <TableCell>{user.role || '-'}</TableCell>
                    <TableCell>{user.status || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          onClick={() => {
                            setSelectedUser(user)
                            setViewOpen(true)
                          }}
                        >
                          <VisibilityRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => onEditUser(user)}>
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => void onDeleteUser(user)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onClose={closeCreateModal} fullWidth maxWidth="md">
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSubmit} className="space-y-4 pt-1">
            {userFormFields(true)}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="outlined" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingUser}>
                {submittingUser ? 'Saving...' : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditModal} fullWidth maxWidth="md">
        <DialogTitle>Update User #{editingUserId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onEditSubmit} className="space-y-4 pt-1">
            {userFormFields(false)}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="outlined" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingUser}>
                {submittingUser ? 'Saving...' : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>User Detail</DialogTitle>
        <DialogContent>
          <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">{JSON.stringify(selectedUser, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UsersPage
