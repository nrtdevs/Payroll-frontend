import { useEffect, useMemo, useState } from 'react'
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
  Switch,
  TableCell,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import CustomInput from './CustomInput'
import CustomLoader from './CustomLoader'
import CustomTable, { type CustomTableColumn } from './CustomTable'
import useToast from '../context/useToast'
import { designationService } from '../services/designationService'
import type { Designation, DesignationPayload } from '../services/designationService'

const emptyDesignationForm: DesignationPayload = { name: '', description: '', is_active: true }

type MasterDesignationSectionProps = {
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

function MasterDesignationSection({ canCreate, canUpdate, canDelete }: MasterDesignationSectionProps) {
  const { showToast } = useToast()
  const [items, setItems] = useState<Designation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<DesignationPayload>(emptyDesignationForm)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Designation | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filterDraft, setFilterDraft] = useState('')
  const [filter, setFilter] = useState('')

  const columns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Active' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const filteredItems = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query))
  }, [items, filter])

  const loadItems = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await designationService.getDesignations()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load designations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filter])

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await designationService.createDesignation(form)
      setCreateOpen(false)
      setForm(emptyDesignationForm)
      showToast('Designation created successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create designation.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingId === null) return
    setSubmitting(true)
    try {
      await designationService.updateDesignation(editingId, form)
      setEditOpen(false)
      setEditingId(null)
      setForm(emptyDesignationForm)
      showToast('Designation updated successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update designation.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (item: Designation) => {
    if (!window.confirm(`Delete designation "${item.name}"?`)) return
    try {
      await designationService.deleteDesignation(item.id)
      showToast('Designation deleted successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete designation.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const onView = async (id: number) => {
    setViewOpen(true)
    setSelected(null)
    try {
      const data = await designationService.getDesignationById(id)
      setSelected(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch designation.')
    }
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
          <Typography variant="h6" className="!font-semibold">
            Designation
          </Typography>
          <Stack direction="row" spacing={1}>
            {canCreate ? (
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create
              </Button>
            ) : null}
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadItems()} disabled={loading}>
              {loading ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
            </Button>
          </Stack>
        </Stack>

        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault()
            setFilter(filterDraft)
          }}
          className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <CustomInput
            label="Filter Name / Description"
            value={filterDraft}
            onChange={(event) => setFilterDraft(event.target.value)}
            placeholder="Software Engineer"
          />
          <Stack direction="row" spacing={1} alignItems="end" className="md:col-span-3">
            <Button type="submit" variant="contained" className="!h-[44px]">
              Apply
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setFilterDraft('')
                setFilter('')
              }}
              className="!h-[44px]"
            >
              Reset
            </Button>
          </Stack>
        </Box>

        {error ? <Alert severity="error" className="!mt-3">{error}</Alert> : null}

        <CustomTable
          columns={columns}
          rows={filteredItems}
          rowKey={(row) => row.id}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
          emptyMessage="No designations found."
          loading={loading}
          renderRow={(row) => (
            <>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.description || '-'}</TableCell>
              <TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell>
              <TableCell align="right">
                <Tooltip title="View">
                  <IconButton onClick={() => void onView(row.id)}>
                    <VisibilityRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <span>
                    <IconButton
                      disabled={!canUpdate}
                      onClick={() => {
                        if (!canUpdate) return
                        setEditingId(row.id)
                        setForm({ name: row.name, description: row.description ?? '', is_active: Boolean(row.is_active) })
                        setEditOpen(true)
                      }}
                    >
                      <EditRoundedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Delete">
                  <span>
                    <IconButton color="error" disabled={!canDelete} onClick={() => void onDelete(row)}>
                      <DeleteRoundedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </>
          )}
        />
      </CardContent>

      <Dialog open={canCreate && createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Designation</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreate} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <CustomInput
              label="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Switch checked={form.is_active} onChange={(_, checked) => setForm((prev) => ({ ...prev, is_active: checked }))} />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setCreateOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={canUpdate && editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Designation #{editingId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onUpdate} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <CustomInput
              label="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Switch checked={form.is_active} onChange={(_, checked) => setForm((prev) => ({ ...prev, is_active: checked }))} />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setEditOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Designation Detail</DialogTitle>
        <DialogContent>
          {!selected ? (
            <CustomLoader label="Loading designation detail..." />
          ) : (
            <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">{JSON.stringify(selected, null, 2)}</pre>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default MasterDesignationSection
