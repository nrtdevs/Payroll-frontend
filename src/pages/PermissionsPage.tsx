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
import { permissionService } from '../services/permissionService'
import type { Permission, PermissionPayload } from '../services/permissionService'
import CustomInput from '../components/CustomInput'

const emptyPermissionForm: PermissionPayload = {
  permission_name: '',
  group: '',
  description: '',
}

const normalizeTokenValue = (value: string): string => {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [permissionError, setPermissionError] = useState('')
  const [submittingPermission, setSubmittingPermission] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [permissionForm, setPermissionForm] = useState<PermissionPayload>(emptyPermissionForm)
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null)

  const loadPermissions = async () => {
    setLoadingPermissions(true)
    setPermissionError('')
    try {
      const data = await permissionService.getPermissions()
      setPermissions(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load permissions.'
      setPermissionError(message)
    } finally {
      setLoadingPermissions(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [])

  const closeCreateModal = () => {
    setCreateOpen(false)
    setPermissionForm(emptyPermissionForm)
  }

  const closeEditModal = () => {
    setEditOpen(false)
    setEditingPermissionId(null)
    setPermissionForm(emptyPermissionForm)
  }

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingPermission(true)
    setPermissionError('')
    try {
      await permissionService.createPermission({
        permission_name: normalizeTokenValue(permissionForm.permission_name),
        group: normalizeTokenValue(permissionForm.group),
        description: permissionForm.description.trim(),
      })
      closeCreateModal()
      await loadPermissions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create permission.'
      setPermissionError(message)
    } finally {
      setSubmittingPermission(false)
    }
  }

  const onEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingPermissionId === null) return
    setSubmittingPermission(true)
    setPermissionError('')
    try {
      await permissionService.updatePermission(editingPermissionId, {
        permission_name: normalizeTokenValue(permissionForm.permission_name),
        group: normalizeTokenValue(permissionForm.group),
        description: permissionForm.description.trim(),
      })
      closeEditModal()
      await loadPermissions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update permission.'
      setPermissionError(message)
    } finally {
      setSubmittingPermission(false)
    }
  }

  const onEditPermission = (permission: Permission) => {
    setEditingPermissionId(permission.id)
    setPermissionForm({
      permission_name: permission.permission_name || '',
      group: permission.group || '',
      description: permission.description || '',
    })
    setEditOpen(true)
  }

  const onDeletePermission = async (permission: Permission) => {
    const approved = window.confirm(`Delete permission "${permission.permission_name}"?`)
    if (!approved) return
    setPermissionError('')
    try {
      await permissionService.deletePermission(permission.id)
      await loadPermissions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete permission.'
      setPermissionError(message)
    }
  }

  const permissionFormFields = (
    <div className="grid grid-cols-1 gap-3">
      <CustomInput
        label="Permission Name"
        value={permissionForm.permission_name}
        onChange={(e) => setPermissionForm((p) => ({ ...p, permission_name: e.target.value }))}
        required
        placeholder="CREATE_USER"
      />
      <CustomInput
        label="Group"
        value={permissionForm.group}
        onChange={(e) => setPermissionForm((p) => ({ ...p, group: e.target.value }))}
        required
        placeholder="USER_MANAGEMENT"
      />
      <CustomInput
        label="Description"
        value={permissionForm.description}
        onChange={(e) => setPermissionForm((p) => ({ ...p, description: e.target.value }))}
        required
        multiline
        minRows={3}
        placeholder="Allow creating users"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              Permission List
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create Permission
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => void loadPermissions()}
                disabled={loadingPermissions}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {permissionError ? (
            <Alert severity="error" className="!mt-3">
              {permissionError}
            </Alert>
          ) : null}

          <TableContainer className="app-scrollbar !mt-4 !overflow-x-auto">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Permission Name</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.length === 0 && !loadingPermissions ? (
                  <TableRow>
                    <TableCell colSpan={6}>No permissions found.</TableCell>
                  </TableRow>
                ) : null}
                {permissions.map((permission) => (
                  <TableRow key={permission.id} hover>
                    <TableCell>{permission.id}</TableCell>
                    <TableCell>{permission.permission_name}</TableCell>
                    <TableCell>{permission.group || '-'}</TableCell>
                    <TableCell>{permission.description || '-'}</TableCell>
                    <TableCell>{permission.created_at || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => onEditPermission(permission)}>
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => void onDeletePermission(permission)}>
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

      <Dialog open={createOpen} onClose={closeCreateModal} fullWidth maxWidth="sm">
        <DialogTitle>Create Permission</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSubmit} className="space-y-4 pt-1">
            {permissionFormFields}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeCreateModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingPermission}>
                {submittingPermission ? 'Saving...' : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle>Update Permission #{editingPermissionId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onEditSubmit} className="space-y-4 pt-1">
            {permissionFormFields}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeEditModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingPermission}>
                {submittingPermission ? 'Saving...' : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PermissionsPage
