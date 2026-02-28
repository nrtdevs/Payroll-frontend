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
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { employmentTypeService } from '../services/employmentTypeService'
import type { EmploymentType, EmploymentTypePayload } from '../services/employmentTypeService'
import { designationService } from '../services/designationService'
import type { Designation, DesignationPayload } from '../services/designationService'

const emptyEmploymentTypeForm: EmploymentTypePayload = { name: '' }
const emptyDesignationForm: DesignationPayload = { name: '', description: '', is_active: true }

function MasterSettingPage() {
  const { showToast } = useToast()

  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loadingEmploymentTypes, setLoadingEmploymentTypes] = useState(false)
  const [loadingDesignations, setLoadingDesignations] = useState(false)
  const [masterError, setMasterError] = useState('')

  const [employmentTypeForm, setEmploymentTypeForm] = useState<EmploymentTypePayload>(emptyEmploymentTypeForm)
  const [designationForm, setDesignationForm] = useState<DesignationPayload>(emptyDesignationForm)

  const [employmentTypeCreateOpen, setEmploymentTypeCreateOpen] = useState(false)
  const [employmentTypeEditOpen, setEmploymentTypeEditOpen] = useState(false)
  const [employmentTypeViewOpen, setEmploymentTypeViewOpen] = useState(false)
  const [designationCreateOpen, setDesignationCreateOpen] = useState(false)
  const [designationEditOpen, setDesignationEditOpen] = useState(false)
  const [designationViewOpen, setDesignationViewOpen] = useState(false)

  const [editingEmploymentTypeId, setEditingEmploymentTypeId] = useState<number | null>(null)
  const [editingDesignationId, setEditingDesignationId] = useState<number | null>(null)
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<EmploymentType | null>(null)
  const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(null)

  const [submittingEmploymentType, setSubmittingEmploymentType] = useState(false)
  const [submittingDesignation, setSubmittingDesignation] = useState(false)

  const [employmentTypePage, setEmploymentTypePage] = useState(1)
  const [designationPage, setDesignationPage] = useState(1)
  const [employmentTypeRowsPerPage, setEmploymentTypeRowsPerPage] = useState(10)
  const [designationRowsPerPage, setDesignationRowsPerPage] = useState(10)

  const [employmentTypeFilterDraft, setEmploymentTypeFilterDraft] = useState('')
  const [designationFilterDraft, setDesignationFilterDraft] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [designationFilter, setDesignationFilter] = useState('')

  const employmentTypeColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'created_at', label: 'Created At' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const designationColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Active' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const filteredEmploymentTypes = useMemo(() => {
    const query = employmentTypeFilter.trim().toLowerCase()
    if (!query) return employmentTypes
    return employmentTypes.filter((item) => item.name.toLowerCase().includes(query))
  }, [employmentTypes, employmentTypeFilter])

  const filteredDesignations = useMemo(() => {
    const query = designationFilter.trim().toLowerCase()
    if (!query) return designations
    return designations.filter(
      (item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
    )
  }, [designations, designationFilter])

  const loadEmploymentTypes = async () => {
    setLoadingEmploymentTypes(true)
    setMasterError('')
    try {
      const data = await employmentTypeService.getEmploymentTypes()
      setEmploymentTypes(data)
    } catch (error) {
      setMasterError(error instanceof Error ? error.message : 'Failed to load employment types.')
    } finally {
      setLoadingEmploymentTypes(false)
    }
  }

  const loadDesignations = async () => {
    setLoadingDesignations(true)
    setMasterError('')
    try {
      const data = await designationService.getDesignations()
      setDesignations(data)
    } catch (error) {
      setMasterError(error instanceof Error ? error.message : 'Failed to load designations.')
    } finally {
      setLoadingDesignations(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadEmploymentTypes(), loadDesignations()])
  }, [])

  useEffect(() => {
    setEmploymentTypePage(1)
  }, [employmentTypeFilter])

  useEffect(() => {
    setDesignationPage(1)
  }, [designationFilter])

  const onCreateEmploymentType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingEmploymentType(true)
    try {
      await employmentTypeService.createEmploymentType(employmentTypeForm)
      setEmploymentTypeCreateOpen(false)
      setEmploymentTypeForm(emptyEmploymentTypeForm)
      showToast('Employment type created successfully.', 'success')
      await loadEmploymentTypes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create employment type.'
      setMasterError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingEmploymentType(false)
    }
  }

  const onUpdateEmploymentType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingEmploymentTypeId === null) return
    setSubmittingEmploymentType(true)
    try {
      await employmentTypeService.updateEmploymentType(editingEmploymentTypeId, employmentTypeForm)
      setEmploymentTypeEditOpen(false)
      setEditingEmploymentTypeId(null)
      setEmploymentTypeForm(emptyEmploymentTypeForm)
      showToast('Employment type updated successfully.', 'success')
      await loadEmploymentTypes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update employment type.'
      setMasterError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingEmploymentType(false)
    }
  }

  const onDeleteEmploymentType = async (item: EmploymentType) => {
    if (!window.confirm(`Delete employment type "${item.name}"?`)) return
    try {
      await employmentTypeService.deleteEmploymentType(item.id)
      showToast('Employment type deleted successfully.', 'success')
      await loadEmploymentTypes()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete employment type.'
      setMasterError(message)
      showToast(message, 'error')
    }
  }

  const onViewEmploymentType = async (id: number) => {
    setEmploymentTypeViewOpen(true)
    setSelectedEmploymentType(null)
    try {
      const data = await employmentTypeService.getEmploymentTypeById(id)
      setSelectedEmploymentType(data)
    } catch (error) {
      setMasterError(error instanceof Error ? error.message : 'Failed to fetch employment type.')
    }
  }

  const onCreateDesignation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingDesignation(true)
    try {
      await designationService.createDesignation(designationForm)
      setDesignationCreateOpen(false)
      setDesignationForm(emptyDesignationForm)
      showToast('Designation created successfully.', 'success')
      await loadDesignations()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create designation.'
      setMasterError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingDesignation(false)
    }
  }

  const onUpdateDesignation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingDesignationId === null) return
    setSubmittingDesignation(true)
    try {
      await designationService.updateDesignation(editingDesignationId, designationForm)
      setDesignationEditOpen(false)
      setEditingDesignationId(null)
      setDesignationForm(emptyDesignationForm)
      showToast('Designation updated successfully.', 'success')
      await loadDesignations()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update designation.'
      setMasterError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingDesignation(false)
    }
  }

  const onDeleteDesignation = async (item: Designation) => {
    if (!window.confirm(`Delete designation "${item.name}"?`)) return
    try {
      await designationService.deleteDesignation(item.id)
      showToast('Designation deleted successfully.', 'success')
      await loadDesignations()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete designation.'
      setMasterError(message)
      showToast(message, 'error')
    }
  }

  const onViewDesignation = async (id: number) => {
    setDesignationViewOpen(true)
    setSelectedDesignation(null)
    try {
      const data = await designationService.getDesignationById(id)
      setSelectedDesignation(data)
    } catch (error) {
      setMasterError(error instanceof Error ? error.message : 'Failed to fetch designation.')
    }
  }

  return (
    <div className="space-y-4">
      {masterError ? <Alert severity="error">{masterError}</Alert> : null}

      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h6" className="!font-semibold">
              Employment Type
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEmploymentTypeCreateOpen(true)}>
                Create
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadEmploymentTypes()} disabled={loadingEmploymentTypes}>
                {loadingEmploymentTypes ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault()
              setEmploymentTypeFilter(employmentTypeFilterDraft)
            }}
            className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-4"
          >
            <CustomInput
              label="Filter Name"
              value={employmentTypeFilterDraft}
              onChange={(event) => setEmploymentTypeFilterDraft(event.target.value)}
              placeholder="Part Time"
            />
            <Stack direction="row" spacing={1} alignItems="end" className="md:col-span-3">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setEmploymentTypeFilterDraft('')
                  setEmploymentTypeFilter('')
                }}
                className="!h-[44px]"
              >
                Reset
              </Button>
            </Stack>
          </Box>

          <CustomTable
            columns={employmentTypeColumns}
            rows={filteredEmploymentTypes}
            rowKey={(row) => row.id}
            page={employmentTypePage}
            rowsPerPage={employmentTypeRowsPerPage}
            onPageChange={setEmploymentTypePage}
            onRowsPerPageChange={(value) => {
              setEmploymentTypeRowsPerPage(value)
              setEmploymentTypePage(1)
            }}
            emptyMessage="No employment types found."
            loading={loadingEmploymentTypes}
            renderRow={(row) => (
              <>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.created_at ?? '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton onClick={() => void onViewEmploymentType(row.id)}>
                      <VisibilityRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => {
                        setEditingEmploymentTypeId(row.id)
                        setEmploymentTypeForm({ name: row.name })
                        setEmploymentTypeEditOpen(true)
                      }}
                    >
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => void onDeleteEmploymentType(row)}>
                      <DeleteRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h6" className="!font-semibold">
              Designation
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDesignationCreateOpen(true)}>
                Create
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadDesignations()} disabled={loadingDesignations}>
                {loadingDesignations ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault()
              setDesignationFilter(designationFilterDraft)
            }}
            className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-4"
          >
            <CustomInput
              label="Filter Name / Description"
              value={designationFilterDraft}
              onChange={(event) => setDesignationFilterDraft(event.target.value)}
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
                  setDesignationFilterDraft('')
                  setDesignationFilter('')
                }}
                className="!h-[44px]"
              >
                Reset
              </Button>
            </Stack>
          </Box>

          <CustomTable
            columns={designationColumns}
            rows={filteredDesignations}
            rowKey={(row) => row.id}
            page={designationPage}
            rowsPerPage={designationRowsPerPage}
            onPageChange={setDesignationPage}
            onRowsPerPageChange={(value) => {
              setDesignationRowsPerPage(value)
              setDesignationPage(1)
            }}
            emptyMessage="No designations found."
            loading={loadingDesignations}
            renderRow={(row) => (
              <>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.description || '-'}</TableCell>
                <TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton onClick={() => void onViewDesignation(row.id)}>
                      <VisibilityRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => {
                        setEditingDesignationId(row.id)
                        setDesignationForm({
                          name: row.name,
                          description: row.description ?? '',
                          is_active: Boolean(row.is_active),
                        })
                        setDesignationEditOpen(true)
                      }}
                    >
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => void onDeleteDesignation(row)}>
                      <DeleteRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={employmentTypeCreateOpen} onClose={() => setEmploymentTypeCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Employment Type</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateEmploymentType} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={employmentTypeForm.name}
              onChange={(event) => setEmploymentTypeForm({ name: event.target.value })}
              required
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setEmploymentTypeCreateOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingEmploymentType}>
                {submittingEmploymentType ? <CustomLoader size={18} color="inherit" /> : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={employmentTypeEditOpen} onClose={() => setEmploymentTypeEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Employment Type #{editingEmploymentTypeId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onUpdateEmploymentType} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={employmentTypeForm.name}
              onChange={(event) => setEmploymentTypeForm({ name: event.target.value })}
              required
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setEmploymentTypeEditOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingEmploymentType}>
                {submittingEmploymentType ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={employmentTypeViewOpen} onClose={() => setEmploymentTypeViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Employment Type Detail</DialogTitle>
        <DialogContent>
          {!selectedEmploymentType ? (
            <CustomLoader label="Loading employment type detail..." />
          ) : (
            <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
              {JSON.stringify(selectedEmploymentType, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={designationCreateOpen} onClose={() => setDesignationCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Designation</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateDesignation} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={designationForm.name}
              onChange={(event) => setDesignationForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <CustomInput
              label="Description"
              value={designationForm.description}
              onChange={(event) => setDesignationForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Switch
                checked={designationForm.is_active}
                onChange={(_, checked) => setDesignationForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setDesignationCreateOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingDesignation}>
                {submittingDesignation ? <CustomLoader size={18} color="inherit" /> : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={designationEditOpen} onClose={() => setDesignationEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Designation #{editingDesignationId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onUpdateDesignation} className="grid gap-3 pt-1">
            <CustomInput
              label="Name"
              value={designationForm.name}
              onChange={(event) => setDesignationForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <CustomInput
              label="Description"
              value={designationForm.description}
              onChange={(event) => setDesignationForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Switch
                checked={designationForm.is_active}
                onChange={(_, checked) => setDesignationForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setDesignationEditOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingDesignation}>
                {submittingDesignation ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={designationViewOpen} onClose={() => setDesignationViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Designation Detail</DialogTitle>
        <DialogContent>
          {!selectedDesignation ? (
            <CustomLoader label="Loading designation detail..." />
          ) : (
            <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
              {JSON.stringify(selectedDesignation, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MasterSettingPage
