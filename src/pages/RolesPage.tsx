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
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { roleService } from '../services/roleService'
import type { Role } from '../services/roleService'
import CustomInput from '../components/CustomInput'

function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [submittingRole, setSubmittingRole] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')

  const loadRoles = async () => {
    setLoadingRoles(true)
    setRoleError('')
    try {
      const data = await roleService.getRoles()
      setRoles(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load roles.'
      setRoleError(message)
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    void loadRoles()
  }, [])

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingRole(true)
    setRoleError('')
    try {
      await roleService.createRole({ name: roleName.trim() })
      setCreateOpen(false)
      setRoleName('')
      await loadRoles()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create role.'
      setRoleError(message)
    } finally {
      setSubmittingRole(false)
    }
  }

  const onDeleteRole = async (role: Role) => {
    const approved = window.confirm(`Delete role "${role.name}"?`)
    if (!approved) return
    setRoleError('')
    try {
      await roleService.deleteRole(role.id)
      await loadRoles()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete role.'
      setRoleError(message)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              Role List
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create Role
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadRoles()} disabled={loadingRoles}>
                Refresh
              </Button>
            </Stack>
          </Stack>

          {roleError ? (
            <Alert severity="error" className="!mt-3">
              {roleError}
            </Alert>
          ) : null}

          <TableContainer className="app-scrollbar !mt-4 !overflow-x-auto">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.length === 0 && !loadingRoles ? (
                  <TableRow>
                    <TableCell colSpan={4}>No roles found.</TableCell>
                  </TableRow>
                ) : null}

                {roles.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>{role.id}</TableCell>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.created_at || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          onClick={() => {
                            setSelectedRole(role)
                            setViewOpen(true)
                          }}
                        >
                          <VisibilityRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => void onDeleteRole(role)}>
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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Role</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSubmit} className="grid gap-3 pt-1">
            <CustomInput
              label="Role Name"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              required
              requiredMessage="Role name is required."
              placeholder="HR_MANAGER"
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="outlined" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingRole}>
                {submittingRole ? 'Saving...' : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Role Detail</DialogTitle>
        <DialogContent>
          <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">{JSON.stringify(selectedRole, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RolesPage
