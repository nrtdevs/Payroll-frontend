import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, IconButton, Stack, Switch, TableCell, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import CustomInput from './CustomInput'
import CustomLoader from './CustomLoader'
import CustomTable, { type CustomTableColumn } from './CustomTable'
import useToast from '../context/useToast'
import { holidayTypeService } from '../services/holidayTypeService'
import type { HolidayType, HolidayTypePayload, HolidayTypeUpdatePayload } from '../services/holidayTypeService'

const emptyForm: HolidayTypePayload = {
  name: '',
  description: '',
  is_paid: true,
}

function MasterHolidayTypeSection() {
  const { showToast } = useToast()
  const [items, setItems] = useState<HolidayType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<HolidayTypePayload>(emptyForm)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filterDraft, setFilterDraft] = useState('')
  const [filter, setFilter] = useState('')

  const columns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'is_paid', label: 'Paid' },
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
      const data = await holidayTypeService.getHolidayTypes()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load holiday types.')
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
    setError('')
    try {
      await holidayTypeService.createHolidayType({
        name: form.name.trim(),
        description: form.description.trim(),
        is_paid: form.is_paid,
      })
      setCreateOpen(false)
      setForm(emptyForm)
      showToast('Holiday type created successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create holiday type.'
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
    setError('')
    try {
      const payload: HolidayTypeUpdatePayload = {
        name: form.name.trim(),
        description: form.description.trim(),
        is_paid: form.is_paid,
      }
      await holidayTypeService.updateHolidayType(editingId, payload)
      setEditOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      showToast('Holiday type updated successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update holiday type.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (item: HolidayType) => {
    if (!window.confirm(`Delete holiday type "${item.name}"?`)) return
    setError('')
    try {
      await holidayTypeService.deleteHolidayType(item.id)
      showToast('Holiday type deleted successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete holiday type.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
          <Typography variant="h6" className="!font-semibold">
            Holiday Type
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
          <CustomInput
            label="Filter Name / Description"
            value={filterDraft}
            onChange={(event) => setFilterDraft(event.target.value)}
            placeholder="National"
          />
          <Stack direction="row" spacing={1} alignItems="end" className="md:col-span-3">
            <Button type="submit" variant="contained" className="!h-[44px]">
              Apply
            </Button>
            <Button
              type="button"
              variant="outlined"
              className="!h-[44px]"
              onClick={() => {
                setFilterDraft('')
                setFilter('')
              }}
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
          loading={loading}
          emptyMessage="No holiday types found."
          renderRow={(row) => (
            <>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.description || '-'}</TableCell>
              <TableCell>{row.is_paid ? 'Yes' : 'No'}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => {
                    setEditingId(row.id)
                    setForm({
                      name: row.name,
                      description: row.description || '',
                      is_paid: row.is_paid,
                    })
                    setEditOpen(true)
                  }}
                >
                  <EditRoundedIcon />
                </IconButton>
                <IconButton color="error" onClick={() => void onDelete(row)}>
                  <DeleteRoundedIcon />
                </IconButton>
              </TableCell>
            </>
          )}
        />
      </CardContent>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Holiday Type</DialogTitle>
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
                Is Paid
              </Typography>
              <Switch checked={form.is_paid} onChange={(_, checked) => setForm((prev) => ({ ...prev, is_paid: checked }))} />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="button" variant="outlined" onClick={() => setCreateOpen(false)}>
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
        <DialogTitle>Update Holiday Type #{editingId}</DialogTitle>
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
                Is Paid
              </Typography>
              <Switch checked={form.is_paid} onChange={(_, checked) => setForm((prev) => ({ ...prev, is_paid: checked }))} />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="button" variant="outlined" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default MasterHolidayTypeSection
