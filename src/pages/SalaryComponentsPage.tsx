import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
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
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import SalaryComponentForm from '../components/salary/SalaryComponentForm'
import useToast from '../context/useToast'
import { salaryService } from '../services/salaryService'
import type { SalaryComponent, SalaryComponentPayload } from '../types/salaryTypes'

const emptyForm: SalaryComponentPayload = {
  name: '',
  type: 'EARNING',
}

function SalaryComponentsPage() {
  const { showToast } = useToast()
  const [rows, setRows] = useState<SalaryComponent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<SalaryComponentPayload>(emptyForm)

  const columns: CustomTableColumn[] = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'action', label: 'Action', align: 'right', sortable: false },
    ],
    [],
  )

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await salaryService.getSalaryComponents()
      setRows(response.items)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load salary components.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const closeCreate = () => {
    setCreateOpen(false)
    setForm(emptyForm)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const onCreate = async () => {
    setSubmitting(true)
    setError('')
    try {
      await salaryService.createSalaryComponent(form)
      closeCreate()
      showToast('Salary component created successfully.', 'success')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to create salary component.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async () => {
    if (editingId === null) return
    setSubmitting(true)
    setError('')
    try {
      await salaryService.updateSalaryComponent(editingId, form)
      closeEdit()
      showToast('Salary component updated successfully.', 'success')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to update salary component.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleStatus = async (row: SalaryComponent) => {
    const nextActive = !(row.is_active ?? true)
    const approved = window.confirm(`${nextActive ? 'Activate' : 'Deactivate'} salary component "${row.name}"?`)
    if (!approved) return

    setError('')
    try {
      await salaryService.updateSalaryComponent(row.id, {
        name: row.name,
        type: row.type,
        is_active: nextActive,
      })
      showToast(`Salary component ${nextActive ? 'activated' : 'deactivated'} successfully.`, 'success')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to update salary component status.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const onOpenEdit = (row: SalaryComponent) => {
    setEditingId(row.id)
    setForm({ name: row.name, type: row.type })
    setEditOpen(true)
  }

  if (loading && rows.length === 0) {
    return <CustomLoader fullscreen label="Loading salary components..." />
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ sm: 'center' }}>
          <Typography variant="h5" className="!font-semibold">
            Salary Components
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
              Add Component
            </Button>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadData()} disabled={loading}>
              {loading ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
            </Button>
          </Stack>
        </Stack>

        {error ? (
          <Alert severity="error" className="!mt-3">
            {error}
          </Alert>
        ) : null}

        <CustomTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size)
            setPage(1)
          }}
          emptyMessage="No salary components found."
          loading={loading}
          renderRow={(row) => (
            <>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.is_active === false ? 'INACTIVE' : 'ACTIVE'}</TableCell>
              <TableCell align="right">
                <Tooltip title="Edit">
                  <IconButton onClick={() => onOpenEdit(row)}>
                    <EditRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={row.is_active === false ? 'Activate' : 'Deactivate'}>
                  <Button color={row.is_active === false ? 'success' : 'warning'} onClick={() => void onToggleStatus(row)}>
                    {row.is_active === false ? 'Activate' : 'Deactivate'}
                  </Button>
                </Tooltip>
              </TableCell>
            </>
          )}
        />
      </CardContent>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Add Salary Component</DialogTitle>
        <DialogContent>
          <SalaryComponentForm
            value={form}
            onChange={setForm}
            onSubmit={() => void onCreate()}
            onCancel={closeCreate}
            submitting={submitting}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Salary Component #{editingId}</DialogTitle>
        <DialogContent>
          <SalaryComponentForm
            value={form}
            onChange={setForm}
            onSubmit={() => void onEdit()}
            onCancel={closeEdit}
            submitting={submitting}
            submitLabel="Update"
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default SalaryComponentsPage
