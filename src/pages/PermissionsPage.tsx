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
  TableCell,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { permissionService } from '../services/permissionService'
import type { Permission, PermissionListFilters, PermissionPayload } from '../services/permissionService'
import CustomInput from '../components/CustomInput'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import CustomLoader from '../components/CustomLoader'
import useToast from '../context/useToast'

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
  const { showToast } = useToast()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [permissionError, setPermissionError] = useState('')
  const [submittingPermission, setSubmittingPermission] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [permissionForm, setPermissionForm] = useState<PermissionPayload>(emptyPermissionForm)
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalPermissions, setTotalPermissions] = useState(0)
  const [filterDraft, setFilterDraft] = useState<PermissionListFilters>({ name: '', group: '' })
  const [filters, setFilters] = useState<PermissionListFilters>({ name: '', group: '' })

  const permissionColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'permission_name', label: 'Permission Name' },
    { key: 'group', label: 'Group' },
    { key: 'description', label: 'Description' },
    { key: 'created_at', label: 'Created At' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const loadPermissions = async () => {
    setLoadingPermissions(true)
    setPermissionError('')
    try {
      const data = await permissionService.getPermissionsPaginated(page, rowsPerPage, filters)
      setPermissions(data.items)
      setTotalPermissions(data.total)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load permissions.'
      setPermissionError(message)
    } finally {
      setLoadingPermissions(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [page, rowsPerPage, filters])

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
      showToast('Permission created successfully.', 'success')
      await loadPermissions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create permission.'
      setPermissionError(message)
      showToast(message, 'error')
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
      showToast('Permission updated successfully.', 'success')
      await loadPermissions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update permission.'
      setPermissionError(message)
      showToast(message, 'error')
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
      showToast('Permission deleted successfully.', 'success')
      await loadPermissions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete permission.'
      setPermissionError(message)
      showToast(message, 'error')
    }
  }

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setFilters({ name: filterDraft.name?.trim() ?? '', group: filterDraft.group?.trim() ?? '' })
  }

  const onResetFilters = () => {
    setFilterDraft({ name: '', group: '' })
    setFilters({ name: '', group: '' })
    setPage(1)
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

  if (loadingPermissions && permissions.length === 0) {
    return <CustomLoader fullscreen label="Loading permissions..." />
  }

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
                {loadingPermissions ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Box component="form" onSubmit={onFilterSubmit} className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <CustomInput
              label="Filter Name"
              value={filterDraft.name ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="user"
            />
            <CustomInput
              label="Filter Group"
              value={filterDraft.group ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, group: event.target.value }))}
              placeholder="AUTH"
            />
            <div className="md:col-span-2 flex items-end gap-2">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply
              </Button>
              <Button type="button" variant="outlined" onClick={onResetFilters} className="!h-[44px]">
                Reset
              </Button>
            </div>
          </Box>

          {permissionError ? (
            <Alert severity="error" className="!mt-3">
              {permissionError}
            </Alert>
          ) : null}

          <CustomTable
            columns={permissionColumns}
            rows={permissions}
            rowKey={(permission) => permission.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            emptyMessage="No permissions found."
            loading={loadingPermissions}
            totalRows={totalPermissions}
            paginateRows={false}
            renderRow={(permission) => (
              <>
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
              </>
            )}
          />
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
                {submittingPermission ? <CustomLoader size={18} color="inherit" /> : 'Create'}
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
                {submittingPermission ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PermissionsPage
