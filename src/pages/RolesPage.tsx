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
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { roleService } from '../services/roleService'
import type { Role, RoleListFilters } from '../services/roleService'
import CustomInput from '../components/CustomInput'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'

function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [submittingRole, setSubmittingRole] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRoles, setTotalRoles] = useState(0)
  const [filterDraft, setFilterDraft] = useState<RoleListFilters>({ name: '' })
  const [filters, setFilters] = useState<RoleListFilters>({ name: '' })

  const roleColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'created_at', label: 'Created At' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const loadRoles = async () => {
    setLoadingRoles(true)
    setRoleError('')
    try {
      const data = await roleService.getRolesPaginated(page, rowsPerPage, filters)
      setRoles(data.items)
      setTotalRoles(data.total)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load roles.'
      setRoleError(message)
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    void loadRoles()
  }, [page, rowsPerPage, filters])

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

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setFilters({ name: filterDraft.name?.trim() ?? '' })
  }

  const onResetFilters = () => {
    setFilterDraft({ name: '' })
    setFilters({ name: '' })
    setPage(1)
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

          <Box component="form" onSubmit={onFilterSubmit} className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <CustomInput
              label="Filter Name"
              value={filterDraft.name ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="MASTER_ADMIN"
            />
            <div className="md:col-span-3 flex items-end gap-2">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply
              </Button>
              <Button type="button" variant="outlined" onClick={onResetFilters} className="!h-[44px]">
                Reset
              </Button>
            </div>
          </Box>

          {roleError ? (
            <Alert severity="error" className="!mt-3">
              {roleError}
            </Alert>
          ) : null}

          <CustomTable
            columns={roleColumns}
            rows={roles}
            rowKey={(role) => role.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            emptyMessage={loadingRoles ? 'Loading roles...' : 'No roles found.'}
            totalRows={totalRoles}
            paginateRows={false}
            renderRow={(role) => (
              <>
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
              </>
            )}
          />
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
