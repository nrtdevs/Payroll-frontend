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
import ToggleOnRoundedIcon from '@mui/icons-material/ToggleOnRounded'
import ToggleOffRoundedIcon from '@mui/icons-material/ToggleOffRounded'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import SalaryStructureForm from '../components/salary/SalaryStructureForm'
import useToast from '../context/useToast'
import { salaryService } from '../services/salaryService'
import type { SalaryComponent, SalaryStructure, SalaryStructurePayload } from '../types/salaryTypes'

const emptyForm: SalaryStructurePayload = {
  name: '',
  component_ids: [],
}

function SalaryStructuresPage() {
  const { showToast } = useToast()
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formError, setFormError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<SalaryStructurePayload>(emptyForm)

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const columns: CustomTableColumn[] = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'components', label: 'Components' },
      { key: 'status', label: 'Status' },
      { key: 'action', label: 'Action', align: 'right', sortable: false },
    ],
    [],
  )

  const componentNameById = useMemo(() => new Map(components.map((component) => [component.id, component.name])), [components])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [structuresResponse, componentsResponse] = await Promise.all([
        salaryService.getSalaryStructures(),
        salaryService.getSalaryComponents(),
      ])
      setStructures(structuresResponse.items)
      setComponents(componentsResponse.items)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load salary structures.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const validateForm = (value: SalaryStructurePayload): string | null => {
    if (!value.name.trim()) return 'Structure name is required.'
    if (value.component_ids.length === 0) return 'Select at least one component.'
    return null
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setForm(emptyForm)
    setFormError('')
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
  }

  const onCreate = async () => {
    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)
    setFormError('')
    setError('')
    try {
      await salaryService.createSalaryStructure(form)
      closeCreate()
      showToast('Salary structure created successfully.', 'success')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to create salary structure.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onOpenEdit = async (row: SalaryStructure) => {
    setError('')
    try {
      const details = await salaryService.getSalaryStructureById(row.id)
      setEditingId(row.id)
      setForm({
        name: details.name,
        component_ids: details.components.map((component) => component.component_id),
        is_active: details.is_active,
      })
      setEditOpen(true)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load salary structure details.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const onUpdate = async () => {
    if (editingId === null) return

    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)
    setFormError('')
    setError('')
    try {
      await salaryService.updateSalaryStructure(editingId, form)
      closeEdit()
      showToast('Salary structure updated successfully.', 'success')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to update salary structure.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleStatus = async (row: SalaryStructure) => {
    const nextActive = !(row.is_active ?? true)
    const approved = window.confirm(`${nextActive ? 'Activate' : 'Deactivate'} salary structure "${row.name}"?`)
    if (!approved) return

    setError('')
    try {
      await salaryService.updateSalaryStructure(row.id, {
        name: row.name,
        component_ids: row.components.map((component) => component.component_id),
        is_active: nextActive,
      })
      showToast(`Salary structure ${nextActive ? 'activated' : 'deactivated'} successfully.`, 'success')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to update salary structure status.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const resolveComponentNames = (row: SalaryStructure): string => {
    if (row.components.length === 0) return '-'
    return row.components
      .map((component) => component.component_name ?? componentNameById.get(component.component_id) ?? `#${component.component_id}`)
      .join(', ')
  }

  if (loading && structures.length === 0) {
    return <CustomLoader fullscreen label="Loading salary structures..." />
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ sm: 'center' }}>
          <Typography variant="h5" className="!font-semibold">
            Salary Structures
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
              Create Structure
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
          rows={structures}
          rowKey={(row) => row.id}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size)
            setPage(1)
          }}
          emptyMessage="No salary structures found."
          loading={loading}
          renderRow={(row) => (
            <>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{resolveComponentNames(row)}</TableCell>
              <TableCell>{row.is_active === false ? 'INACTIVE' : 'ACTIVE'}</TableCell>
              <TableCell align="right">
                <Tooltip title="Edit">
                  <IconButton onClick={() => void onOpenEdit(row)}>
                    <EditRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={row.is_active === false ? 'Activate' : 'Deactivate'}>
                  <IconButton color={row.is_active === false ? 'success' : 'warning'} onClick={() => void onToggleStatus(row)}>
                    {row.is_active === false ? <ToggleOnRoundedIcon /> : <ToggleOffRoundedIcon />}
                  </IconButton>
                </Tooltip>
              </TableCell>
            </>
          )}
        />
      </CardContent>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Create Salary Structure</DialogTitle>
        <DialogContent>
          <SalaryStructureForm
            value={form}
            components={components}
            onChange={setForm}
            onSubmit={() => void onCreate()}
            onCancel={closeCreate}
            submitting={submitting}
            submitLabel="Create"
            formError={formError}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Salary Structure #{editingId}</DialogTitle>
        <DialogContent>
          <SalaryStructureForm
            value={form}
            components={components}
            onChange={setForm}
            onSubmit={() => void onUpdate()}
            onCancel={closeEdit}
            submitting={submitting}
            submitLabel="Update"
            formError={formError}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default SalaryStructuresPage
