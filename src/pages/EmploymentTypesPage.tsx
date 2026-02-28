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
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { employmentTypeService } from '../services/employmentTypeService'
import type { EmploymentType, EmploymentTypePayload } from '../services/employmentTypeService'

const emptyEmploymentTypeForm: EmploymentTypePayload = {
  name: '',
}

function EmploymentTypesPage() {
  const { showToast } = useToast()
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([])
  const [loadingEmploymentTypes, setLoadingEmploymentTypes] = useState(false)
  const [employmentTypeError, setEmploymentTypeError] = useState('')
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<EmploymentType | null>(null)
  const [loadingEmploymentTypeDetail, setLoadingEmploymentTypeDetail] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [employmentTypeForm, setEmploymentTypeForm] = useState<EmploymentTypePayload>(emptyEmploymentTypeForm)
  const [editingEmploymentTypeId, setEditingEmploymentTypeId] = useState<number | null>(null)
  const [submittingEmploymentType, setSubmittingEmploymentType] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filterDraftName, setFilterDraftName] = useState('')
  const [filterName, setFilterName] = useState('')

  const employmentTypeColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'created_at', label: 'Created At' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const filteredEmploymentTypes = useMemo(() => {
    const query = filterName.trim().toLowerCase()
    if (!query) return employmentTypes
    return employmentTypes.filter((item) => item.name.toLowerCase().includes(query))
  }, [employmentTypes, filterName])

  const loadEmploymentTypes = async () => {
    setLoadingEmploymentTypes(true)
    setEmploymentTypeError('')
    try {
      const data = await employmentTypeService.getEmploymentTypes()
      setEmploymentTypes(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load employment types.'
      setEmploymentTypeError(message)
    } finally {
      setLoadingEmploymentTypes(false)
    }
  }

  useEffect(() => {
    void loadEmploymentTypes()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filterName])

  const closeCreateModal = () => {
    setCreateOpen(false)
    setEmploymentTypeForm(emptyEmploymentTypeForm)
  }

  const closeEditModal = () => {
    setEditOpen(false)
    setEditingEmploymentTypeId(null)
    setEmploymentTypeForm(emptyEmploymentTypeForm)
  }

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingEmploymentType(true)
    setEmploymentTypeError('')
    try {
      await employmentTypeService.createEmploymentType(employmentTypeForm)
      closeCreateModal()
      showToast('Employment type created successfully.', 'success')
      await loadEmploymentTypes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create employment type.'
      setEmploymentTypeError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingEmploymentType(false)
    }
  }

  const onEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingEmploymentTypeId === null) return
    setSubmittingEmploymentType(true)
    setEmploymentTypeError('')
    try {
      await employmentTypeService.updateEmploymentType(editingEmploymentTypeId, employmentTypeForm)
      closeEditModal()
      showToast('Employment type updated successfully.', 'success')
      await loadEmploymentTypes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update employment type.'
      setEmploymentTypeError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingEmploymentType(false)
    }
  }

  const onEditEmploymentType = (employmentType: EmploymentType) => {
    setEditingEmploymentTypeId(employmentType.id)
    setEmploymentTypeForm({ name: employmentType.name })
    setEditOpen(true)
  }

  const onDeleteEmploymentType = async (employmentType: EmploymentType) => {
    const approved = window.confirm(`Delete employment type "${employmentType.name}"?`)
    if (!approved) return
    setEmploymentTypeError('')
    try {
      await employmentTypeService.deleteEmploymentType(employmentType.id)
      if (selectedEmploymentType?.id === employmentType.id) {
        setSelectedEmploymentType(null)
      }
      await loadEmploymentTypes()
      showToast('Employment type deleted successfully.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete employment type.'
      setEmploymentTypeError(message)
      showToast(message, 'error')
    }
  }

  const onViewEmploymentType = async (id: number) => {
    setEmploymentTypeError('')
    setViewOpen(true)
    setLoadingEmploymentTypeDetail(true)
    setSelectedEmploymentType(null)
    try {
      const employmentType = await employmentTypeService.getEmploymentTypeById(id)
      setSelectedEmploymentType(employmentType)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch employment type.'
      setEmploymentTypeError(message)
    } finally {
      setLoadingEmploymentTypeDetail(false)
    }
  }

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilterName(filterDraftName)
  }

  const onResetFilters = () => {
    setFilterDraftName('')
    setFilterName('')
  }

  if (loadingEmploymentTypes && employmentTypes.length === 0) {
    return <CustomLoader fullscreen label="Loading employment types..." />
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              Employment Type List
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create Employment Type
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadEmploymentTypes()} disabled={loadingEmploymentTypes}>
                {loadingEmploymentTypes ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Box component="form" onSubmit={onFilterSubmit} className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <CustomInput
              label="Filter Name"
              value={filterDraftName}
              onChange={(event) => setFilterDraftName(event.target.value)}
              placeholder="Part Time"
            />
            <Stack direction="row" spacing={1} alignItems="end" className="md:col-span-3">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply
              </Button>
              <Button type="button" variant="outlined" onClick={onResetFilters} className="!h-[44px]">
                Reset
              </Button>
            </Stack>
          </Box>

          {employmentTypeError ? (
            <Alert severity="error" className="!mt-3">
              {employmentTypeError}
            </Alert>
          ) : null}

          <CustomTable
            columns={employmentTypeColumns}
            rows={filteredEmploymentTypes}
            rowKey={(employmentType) => employmentType.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            emptyMessage="No employment types found."
            loading={loadingEmploymentTypes}
            renderRow={(employmentType) => (
              <>
                <TableCell>{employmentType.id}</TableCell>
                <TableCell>{employmentType.name}</TableCell>
                <TableCell>{employmentType.created_at ?? '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton onClick={() => void onViewEmploymentType(employmentType.id)}>
                      <VisibilityRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEditEmploymentType(employmentType)}>
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => void onDeleteEmploymentType(employmentType)}>
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
        <DialogTitle>Create Employment Type</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSubmit} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={employmentTypeForm.name}
              onChange={(e) => setEmploymentTypeForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeCreateModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingEmploymentType}>
                {submittingEmploymentType ? <CustomLoader size={18} color="inherit" /> : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle>Update Employment Type #{editingEmploymentTypeId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onEditSubmit} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={employmentTypeForm.name}
              onChange={(e) => setEmploymentTypeForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeEditModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingEmploymentType}>
                {submittingEmploymentType ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Employment Type Detail</DialogTitle>
        <DialogContent>
          {loadingEmploymentTypeDetail ? (
            <CustomLoader label="Loading employment type detail..." />
          ) : (
            <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
              {JSON.stringify(selectedEmploymentType, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmploymentTypesPage
