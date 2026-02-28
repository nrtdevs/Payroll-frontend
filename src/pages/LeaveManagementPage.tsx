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
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import CustomAutocomplete, { type CustomAutocompleteOption } from '../components/CustomAutocomplete'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { employmentTypeService } from '../services/employmentTypeService'
import { leaveTypeService } from '../services/leaveTypeService'
import { leaveMasterService } from '../services/leaveMasterService'
import type { EmploymentType } from '../services/employmentTypeService'
import type { LeaveType } from '../services/leaveTypeService'
import type { CreateLeaveMasterPayload, LeaveMaster, UpdateLeaveMasterPayload } from '../services/leaveMasterService'

type CreateLeaveMasterForm = {
  employment_type_id: number | null
  leaves: Array<{
    row_id: string
    leave_type_id: number | null
    total_leave_days: string
  }>
}

type LeaveMasterGroupRow = {
  employment_type_id: number
  employment_type_name: string
  leaves: LeaveMaster[]
  total_leave_days: number
}

type UpdateLeaveMasterForm = {
  employment_type_id: number | null
  leaves: Array<{
    row_id: string
    leave_type_id: number | null
    total_leave_days: string
  }>
}

const emptyCreateForm: CreateLeaveMasterForm = {
  employment_type_id: null,
  leaves: [
    {
      row_id: 'leave_1',
      leave_type_id: null,
      total_leave_days: '',
    },
  ],
}

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

const toUpdateFormFromGroup = (group: LeaveMasterGroupRow): UpdateLeaveMasterForm => {
  return {
    employment_type_id: group.employment_type_id,
    leaves: group.leaves.map((leave, index) => ({
      row_id: `edit_leave_${index + 1}_${leave.id}`,
      leave_type_id: leave.leave_type_id,
      total_leave_days: String(leave.total_leave_days),
    })),
  }
}

const getUniqueLeaveTypeNames = (leaves: LeaveMaster[]): string => {
  const uniqueNames = Array.from(new Set(leaves.map((leave) => leave.leave_type_name).filter(Boolean)))
  return uniqueNames.join(', ')
}

function LeaveManagementPage() {
  const { showToast } = useToast()
  const [leaveMasters, setLeaveMasters] = useState<LeaveMaster[]>([])
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loadingLeaveMasters, setLoadingLeaveMasters] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [error, setError] = useState('')
  const [selectedLeaveMasterGroup, setSelectedLeaveMasterGroup] = useState<LeaveMasterGroupRow | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateLeaveMasterForm>(emptyCreateForm)
  const [createLeaveRowCounter, setCreateLeaveRowCounter] = useState(1)
  const [updateForm, setUpdateForm] = useState<UpdateLeaveMasterForm>({ employment_type_id: null, leaves: [] })
  const [updateLeaveRowCounter, setUpdateLeaveRowCounter] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filterDraft, setFilterDraft] = useState('')
  const [filter, setFilter] = useState('')

  const employmentTypeOptions: CustomAutocompleteOption<number>[] = employmentTypes.map((item) => ({
    label: `${item.name} (#${item.id})`,
    value: item.id,
  }))

  const leaveTypeOptions: CustomAutocompleteOption<number>[] = leaveTypes.map((item) => ({
    label: `${item.name} (#${item.id})`,
    value: item.id,
  }))

  const leaveMasterColumns: CustomTableColumn[] = [
    { key: 'employment_type_name', label: 'Employment Type' },
    { key: 'leave_type_names', label: 'Leave Types' },
    { key: 'total_leave_days', label: 'Total Leave Days' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const groupedLeaveMasters = useMemo<LeaveMasterGroupRow[]>(() => {
    const grouped = new Map<number, LeaveMasterGroupRow>()
    leaveMasters.forEach((item) => {
      const existing = grouped.get(item.employment_type_id)
      if (existing) {
        existing.leaves.push(item)
        existing.total_leave_days += item.total_leave_days
        return
      }
      grouped.set(item.employment_type_id, {
        employment_type_id: item.employment_type_id,
        employment_type_name: item.employment_type_name,
        leaves: [item],
        total_leave_days: item.total_leave_days,
      })
    })
    return Array.from(grouped.values())
  }, [leaveMasters])

  const filteredLeaveMasterGroups = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return groupedLeaveMasters
    return groupedLeaveMasters.filter(
      (item) =>
        item.employment_type_name.toLowerCase().includes(query) ||
        item.leaves.some((leave) => leave.leave_type_name.toLowerCase().includes(query)) ||
        String(item.total_leave_days).includes(query),
    )
  }, [groupedLeaveMasters, filter])

  const loadLeaveMasters = async () => {
    setLoadingLeaveMasters(true)
    setError('')
    try {
      const data = await leaveMasterService.getLeaveMasters()
      setLeaveMasters(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave masters.')
    } finally {
      setLoadingLeaveMasters(false)
    }
  }

  const loadOptions = async () => {
    setLoadingOptions(true)
    setError('')
    try {
      const [employmentTypeData, leaveTypeData] = await Promise.all([
        employmentTypeService.getEmploymentTypes(),
        leaveTypeService.getLeaveTypes(),
      ])
      setEmploymentTypes(employmentTypeData)
      setLeaveTypes(leaveTypeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employment type / leave type options.')
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadLeaveMasters(), loadOptions()])
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filter])

  const closeCreateModal = () => {
    setCreateOpen(false)
    setCreateForm(emptyCreateForm)
    setCreateLeaveRowCounter(1)
  }

  const closeEditModal = () => {
    setEditOpen(false)
    setUpdateForm({ employment_type_id: null, leaves: [] })
    setUpdateLeaveRowCounter(1)
  }

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (createForm.employment_type_id === null) {
      setError('Employment Type is required.')
      return
    }

    if (createForm.leaves.length === 0) {
      setError('At least one leave entry is required.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const leaves = createForm.leaves.map((item) => {
        if (item.leave_type_id === null) {
          throw new Error('Leave Type is required for all rows.')
        }
        const totalLeaveDays = toNumberOrNull(item.total_leave_days)
        if (totalLeaveDays === null) {
          throw new Error('Total Leave Days must be a valid number for all rows.')
        }
        return {
          leave_type_id: item.leave_type_id,
          total_leave_days: totalLeaveDays,
        }
      })

      const payload: CreateLeaveMasterPayload = {
        employment_type_id: createForm.employment_type_id,
        leaves,
      }
      await leaveMasterService.createLeaveMaster(payload)
      closeCreateModal()
      showToast('Leave master created successfully.', 'success')
      await loadLeaveMasters()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create leave master.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onViewLeaveMaster = (row: LeaveMasterGroupRow) => {
    setError('')
    setViewOpen(true)
    setSelectedLeaveMasterGroup(row)
  }

  const onEditLeaveMaster = (row: LeaveMasterGroupRow) => {
    const nextForm = toUpdateFormFromGroup(row)
    setUpdateForm(nextForm)
    setUpdateLeaveRowCounter(Math.max(1, nextForm.leaves.length))
    setEditOpen(true)
  }

  const onEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (updateForm.employment_type_id === null) {
      setError('Employment Type is required.')
      return
    }
    if (updateForm.leaves.length === 0) {
      setError('At least one leave entry is required.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const leaves = updateForm.leaves.map((item) => {
        if (item.leave_type_id === null) {
          throw new Error('Leave Type is required for all rows.')
        }
        const totalLeaveDays = toNumberOrNull(item.total_leave_days)
        if (totalLeaveDays === null) {
          throw new Error('Total Leave Days must be a valid number for all rows.')
        }
        return {
          leave_type_id: item.leave_type_id,
          total_leave_days: totalLeaveDays,
        }
      })

      const payload: UpdateLeaveMasterPayload = {
        employment_type_id: updateForm.employment_type_id,
        leaves,
      }
      await leaveMasterService.updateLeaveMaster(payload)
      closeEditModal()
      showToast('Leave master updated successfully.', 'success')
      await loadLeaveMasters()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update leave master.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingLeaveMasters && leaveMasters.length === 0) {
    return <CustomLoader fullscreen label="Loading leave masters..." />
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              Leave Master
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create Leave Master
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadLeaveMasters()} disabled={loadingLeaveMasters}>
                {loadingLeaveMasters ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
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
              label="Filter"
              value={filterDraft}
              onChange={(event) => setFilterDraft(event.target.value)}
              placeholder="Contract / Sick Leave / 12"
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

          {error ? (
            <Alert severity="error" className="!mt-3">
              {error}
            </Alert>
          ) : null}

          <CustomTable
            columns={leaveMasterColumns}
            rows={filteredLeaveMasterGroups}
            rowKey={(item) => item.employment_type_id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            emptyMessage="No leave masters found."
            loading={loadingLeaveMasters}
            renderRow={(item) => (
              <>
                <TableCell>{item.employment_type_name || '-'}</TableCell>
                <TableCell>{getUniqueLeaveTypeNames(item.leaves) || '-'}</TableCell>
                <TableCell>{item.total_leave_days}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEditLeaveMaster(item)}>
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View">
                    <IconButton onClick={() => onViewLeaveMaster(item)}>
                      <VisibilityRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onClose={closeCreateModal} fullWidth maxWidth="sm">
        <DialogTitle>Create Leave Master</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSubmit} className="grid gap-3 pt-1">
            {loadingOptions ? <CustomLoader label="Loading options..." /> : null}
            <CustomAutocomplete
              label="Employment Type"
              options={employmentTypeOptions}
              value={createForm.employment_type_id}
              required
              requiredMessage="Employment Type is required."
              onChange={(value) => setCreateForm((prev) => ({ ...prev, employment_type_id: value }))}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Leaves</Typography>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  const next = createLeaveRowCounter + 1
                  setCreateLeaveRowCounter(next)
                  setCreateForm((prev) => ({
                    ...prev,
                    leaves: [
                      ...prev.leaves,
                      {
                        row_id: `leave_${next}`,
                        leave_type_id: null,
                        total_leave_days: '',
                      },
                    ],
                  }))
                }}
              >
                Add Row
              </Button>
            </Stack>
            {createForm.leaves.map((item) => (
              <div key={item.row_id} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
                <CustomAutocomplete
                  label="Leave Type"
                  options={leaveTypeOptions}
                  value={item.leave_type_id}
                  required
                  requiredMessage="Leave Type is required."
                  onChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      leaves: prev.leaves.map((row) => (row.row_id === item.row_id ? { ...row, leave_type_id: value } : row)),
                    }))
                  }
                />
                <CustomInput
                  label="Total Leave Days"
                  type="number"
                  value={item.total_leave_days}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      leaves: prev.leaves.map((row) =>
                        row.row_id === item.row_id ? { ...row, total_leave_days: event.target.value } : row,
                      ),
                    }))
                  }
                  required
                />
                <Stack direction="row" justifyContent="flex-end" className="md:col-span-2">
                  <IconButton
                    color="error"
                    disabled={createForm.leaves.length === 1}
                    onClick={() =>
                      setCreateForm((prev) => ({
                        ...prev,
                        leaves: prev.leaves.length === 1 ? prev.leaves : prev.leaves.filter((row) => row.row_id !== item.row_id),
                      }))
                    }
                  >
                    <DeleteRoundedIcon />
                  </IconButton>
                </Stack>
              </div>
            ))}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeCreateModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Leave Master Detail</DialogTitle>
        <DialogContent>
          {selectedLeaveMasterGroup ? (
            <div className="space-y-3">
              <Typography variant="body2">
                <strong>Employment Type:</strong> {selectedLeaveMasterGroup.employment_type_name} (#{selectedLeaveMasterGroup.employment_type_id})
              </Typography>
              <Typography variant="body2">
                <strong>Total Leave Days:</strong> {selectedLeaveMasterGroup.total_leave_days}
              </Typography>
              <div className="grid grid-cols-1 gap-2">
                {selectedLeaveMasterGroup.leaves.map((leave) => (
                  <Card key={leave.id} variant="outlined">
                    <CardContent className="!py-2">
                      <Typography variant="body2">
                        <strong>Leave Type:</strong> {leave.leave_type_name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Proof Required:</strong> {leave.proof_required ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Leave Days:</strong> {leave.total_leave_days}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No details available.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle>Update Leave Master</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onEditSubmit} className="grid gap-3 pt-1">
            <CustomAutocomplete
              label="Employment Type"
              options={employmentTypeOptions}
              value={updateForm.employment_type_id}
              required
              requiredMessage="Employment Type is required."
              disabled
              onChange={() => {
                // disabled field; no-op
              }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Leaves</Typography>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  const next = updateLeaveRowCounter + 1
                  setUpdateLeaveRowCounter(next)
                  setUpdateForm((prev) => ({
                    ...prev,
                    leaves: [
                      ...prev.leaves,
                      {
                        row_id: `edit_leave_${next}`,
                        leave_type_id: null,
                        total_leave_days: '',
                      },
                    ],
                  }))
                }}
              >
                Add Row
              </Button>
            </Stack>
            {updateForm.leaves.map((item) => (
              <div key={item.row_id} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
                <CustomAutocomplete
                  label="Leave Type"
                  options={leaveTypeOptions}
                  value={item.leave_type_id}
                  required
                  requiredMessage="Leave Type is required."
                  onChange={(value) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      leaves: prev.leaves.map((row) => (row.row_id === item.row_id ? { ...row, leave_type_id: value } : row)),
                    }))
                  }
                />
                <CustomInput
                  label="Total Leave Days"
                  type="number"
                  value={item.total_leave_days}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      leaves: prev.leaves.map((row) =>
                        row.row_id === item.row_id ? { ...row, total_leave_days: event.target.value } : row,
                      ),
                    }))
                  }
                  required
                />
                <Stack direction="row" justifyContent="flex-end" className="md:col-span-2">
                  <IconButton
                    color="error"
                    disabled={updateForm.leaves.length === 1}
                    onClick={() =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        leaves: prev.leaves.length === 1 ? prev.leaves : prev.leaves.filter((row) => row.row_id !== item.row_id),
                      }))
                    }
                  >
                    <DeleteRoundedIcon />
                  </IconButton>
                </Stack>
              </div>
            ))}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeEditModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LeaveManagementPage
