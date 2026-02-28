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
import { employmentTypeService } from '../services/employmentTypeService'
import type { EmploymentType, EmploymentTypePayload } from '../services/employmentTypeService'

const emptyEmploymentTypeForm: EmploymentTypePayload = { name: '' }

function MasterEmploymentTypeSection() {
  const { showToast } = useToast()
  const [items, setItems] = useState<EmploymentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<EmploymentTypePayload>(emptyEmploymentTypeForm)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<EmploymentType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filterDraft, setFilterDraft] = useState('')
  const [filter, setFilter] = useState('')

  const columns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'created_at', label: 'Created At' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const filteredItems = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [items, filter])

  const loadItems = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await employmentTypeService.getEmploymentTypes()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employment types.')
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
      await employmentTypeService.createEmploymentType(form)
      setCreateOpen(false)
      setForm(emptyEmploymentTypeForm)
      showToast('Employment type created successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create employment type.'
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
      await employmentTypeService.updateEmploymentType(editingId, form)
      setEditOpen(false)
      setEditingId(null)
      setForm(emptyEmploymentTypeForm)
      showToast('Employment type updated successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update employment type.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (item: EmploymentType) => {
    if (!window.confirm(`Delete employment type "${item.name}"?`)) return
    try {
      await employmentTypeService.deleteEmploymentType(item.id)
      showToast('Employment type deleted successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete employment type.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const onView = async (id: number) => {
    setViewOpen(true)
    setSelected(null)
    try {
      const data = await employmentTypeService.getEmploymentTypeById(id)
      setSelected(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employment type.')
    }
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
          <Typography variant="h6" className="!font-semibold">
            Employment Type
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
              Create
            </Button>
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
          <CustomInput label="Filter Name" value={filterDraft} onChange={(event) => setFilterDraft(event.target.value)} placeholder="Part Time" />
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
          emptyMessage="No employment types found."
          loading={loading}
          renderRow={(row) => (
            <>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.created_at ?? '-'}</TableCell>
              <TableCell align="right">
                <Tooltip title="View">
                  <IconButton onClick={() => void onView(row.id)}>
                    <VisibilityRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    onClick={() => {
                      setEditingId(row.id)
                      setForm({ name: row.name })
                      setEditOpen(true)
                    }}
                  >
                    <EditRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton color="error" onClick={() => void onDelete(row)}>
                    <DeleteRoundedIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </>
          )}
        />
      </CardContent>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Employment Type</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreate} className="grid gap-3 pt-1">
            <CustomInput label="Name" value={form.name} onChange={(event) => setForm({ name: event.target.value })} required />
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Employment Type #{editingId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onUpdate} className="grid gap-3 pt-1">
            <CustomInput label="Name" value={form.name} onChange={(event) => setForm({ name: event.target.value })} required />
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
        <DialogTitle>Employment Type Detail</DialogTitle>
        <DialogContent>
          {!selected ? (
            <CustomLoader label="Loading employment type detail..." />
          ) : (
            <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">{JSON.stringify(selected, null, 2)}</pre>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default MasterEmploymentTypeSection
