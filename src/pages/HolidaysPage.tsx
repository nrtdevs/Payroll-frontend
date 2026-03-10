import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  TableCell,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import CustomAutocomplete, { type CustomAutocompleteOption } from '../components/CustomAutocomplete'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { branchService } from '../services/branchService'
import type { Branch } from '../services/branchService'
import { holidayTypeService } from '../services/holidayTypeService'
import type { HolidayType } from '../services/holidayTypeService'
import { holidayService } from '../services/holidayService'
import type { Holiday, HolidayCreatePayload } from '../services/holidayService'
import { sessionService } from '../services/sessionService'
import type { SessionRecord } from '../services/sessionService'

const emptyCreateForm: HolidayCreatePayload = {
  name: '',
  holiday_date: '',
  holiday_type_id: 0,
  branch_id: null,
  session_id: 0,
  description: '',
  is_optional: false,
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const toDateKey = (year: number, monthIndex: number, day: number): string =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

function HolidaysPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState<Holiday[]>([])
  const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Holiday | null>(null)
  const [createForm, setCreateForm] = useState<HolidayCreatePayload>(emptyCreateForm)
  const [updateDescription, setUpdateDescription] = useState('')
  const [updateOptional, setUpdateOptional] = useState(false)
  const [filterSessionId, setFilterSessionId] = useState<number | null>(null)
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [checkDate, setCheckDate] = useState('')
  const [checkBranchId, setCheckBranchId] = useState<number | null>(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [checkResult, setCheckResult] = useState<{ is_holiday: boolean; holiday_id: number | null; holiday_name: string | null } | null>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const holidayTypeOptions: CustomAutocompleteOption<number>[] = useMemo(
    () => holidayTypes.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id })),
    [holidayTypes],
  )
  const sessionOptions: CustomAutocompleteOption<number>[] = useMemo(
    () => sessions.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id })),
    [sessions],
  )
  const branchOptions: CustomAutocompleteOption<number>[] = useMemo(
    () => branches.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id })),
    [branches],
  )

  const columns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'holiday_date', label: 'Date' },
    { key: 'holiday_type', label: 'Type' },
    { key: 'session_id', label: 'Session' },
    { key: 'branch_id', label: 'Branch' },
    { key: 'is_optional', label: 'Optional' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const holidayByDate = useMemo(() => {
    const map = new Map<string, Holiday[]>()
    items.forEach((item) => {
      const key = item.holiday_date
      if (!key) return
      const existing = map.get(key) ?? []
      existing.push(item)
      map.set(key, existing)
    })
    return map
  }, [items])

  const calendarCells = useMemo(() => {
    const year = calendarCursor.getFullYear()
    const month = calendarCursor.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: Array<{ date: string | null; day: number | null }> = []
    for (let i = 0; i < firstWeekday; i += 1) cells.push({ date: null, day: null })
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: toDateKey(year, month, day), day })
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null })
    return cells
  }, [calendarCursor])

  const onOpenCreateForDate = (date: string) => {
    setCreateForm((prev) => ({
      ...prev,
      holiday_date: date,
      session_id: prev.session_id || filterSessionId || sessions[0]?.id || 0,
    }))
    setCreateOpen(true)
  }

  const loadOptions = async () => {
    setLoadingOptions(true)
    try {
      const [holidayTypeData, sessionsData, branchesData] = await Promise.all([
        holidayTypeService.getHolidayTypes(),
        sessionService.listSessions(),
        branchService.getBranches(),
      ])
      setHolidayTypes(holidayTypeData)
      setSessions(sessionsData)
      setBranches(branchesData)
    } catch {
      // Keep page usable if options fail.
    } finally {
      setLoadingOptions(false)
    }
  }

  const loadItems = async () => {
    setLoading(true)
    setError('')
    try {
      const year = filterYear.trim() ? Number(filterYear.trim()) : null
      const data = await holidayService.listHolidays(filterSessionId, Number.isFinite(year) ? year : null)
      setItems(data)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load holidays.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadOptions(), loadItems()])
  }, [])

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.name.trim()) {
      setError('Holiday name is required.')
      return
    }
    if (!createForm.holiday_date) {
      setError('Holiday date is required.')
      return
    }
    if (!createForm.holiday_type_id) {
      setError('Holiday type is required.')
      return
    }
    if (!createForm.session_id) {
      setError('Session is required.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await holidayService.createHoliday({
        ...createForm,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      })
      setCreateOpen(false)
      setCreateForm(emptyCreateForm)
      showToast('Holiday created successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create holiday.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onOpenEdit = (item: Holiday) => {
    setEditingId(item.id)
    setUpdateDescription(item.description || '')
    setUpdateOptional(Boolean(item.is_optional))
    setEditOpen(true)
  }

  const onUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingId === null) return
    setSubmitting(true)
    setError('')
    try {
      await holidayService.updateHoliday(editingId, {
        description: updateDescription.trim(),
        is_optional: updateOptional,
      })
      setEditOpen(false)
      setEditingId(null)
      showToast('Holiday updated successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update holiday.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (item: Holiday) => {
    if (!window.confirm(`Delete holiday "${item.name}"?`)) return
    setError('')
    try {
      await holidayService.deleteHoliday(item.id)
      showToast('Holiday deleted successfully.', 'success')
      await loadItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete holiday.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const onView = async (id: number) => {
    setViewOpen(true)
    setSelected(null)
    try {
      const data = await holidayService.getHolidayById(id)
      setSelected(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holiday.')
    }
  }

  const onCheckHoliday = async () => {
    if (!checkDate || checkBranchId === null) {
      setError('Check date and branch are required.')
      return
    }
    setCheckLoading(true)
    setError('')
    try {
      const data = await holidayService.checkHoliday(checkDate, checkBranchId)
      setCheckResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check holiday.')
    } finally {
      setCheckLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent className="space-y-3">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              Holiday
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create Holiday
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadItems()} disabled={loading}>
                {loading ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Box component="form" className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); void loadItems() }}>
            <CustomAutocomplete
              label="Session"
              options={sessionOptions}
              value={filterSessionId}
              onChange={(value) => setFilterSessionId(value)}
              placeholder={loadingOptions ? 'Loading sessions...' : 'All sessions'}
            />
            <CustomInput label="Year" type="number" value={filterYear} onChange={(event) => setFilterYear(event.target.value)} />
            <Stack direction="row" spacing={1} alignItems="end" className="md:col-span-2">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply Filter
              </Button>
              <Button
                type="button"
                variant="outlined"
                className="!h-[44px]"
                onClick={() => {
                  setFilterSessionId(null)
                  setFilterYear(String(new Date().getFullYear()))
                  void loadItems()
                }}
              >
                Reset
              </Button>
            </Stack>
          </Box>

          <Card variant="outlined" className="!rounded-xl">
            <CardContent className="space-y-3">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" className="!font-semibold">
                  Calendar
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    onClick={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    size="small"
                  >
                    <ChevronLeftRoundedIcon />
                  </IconButton>
                  <Typography variant="subtitle1" className="!font-semibold">
                    {MONTH_LABELS[calendarCursor.getMonth()]} {calendarCursor.getFullYear()}
                  </Typography>
                  <IconButton
                    onClick={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    size="small"
                  >
                    <ChevronRightRoundedIcon />
                  </IconButton>
                </Stack>
              </Stack>

              <Box className="grid grid-cols-7 gap-2">
                {WEEKDAY_LABELS.map((label) => (
                  <Typography key={label} variant="caption" color="text.secondary" className="text-center !font-semibold">
                    {label}
                  </Typography>
                ))}
                {calendarCells.map((cell, index) => {
                  const isHoliday = Boolean(cell.date && holidayByDate.has(cell.date))
                  const holidayCount = cell.date ? holidayByDate.get(cell.date)?.length ?? 0 : 0
                  return (
                    <Button
                      key={`day-${index}`}
                      variant={isHoliday ? 'contained' : 'outlined'}
                      color={isHoliday ? 'warning' : 'inherit'}
                      disabled={!cell.date}
                      onClick={() => {
                        if (!cell.date) return
                        onOpenCreateForDate(cell.date)
                      }}
                      className="!h-[64px] !min-w-0 !px-1"
                    >
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="body2" className="!font-semibold">
                          {cell.day ?? ''}
                        </Typography>
                        {isHoliday ? (
                          <Typography variant="caption" className="!text-[10px]">
                            {holidayCount} holiday
                          </Typography>
                        ) : null}
                      </Stack>
                    </Button>
                  )
                })}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Click any date to open Create Holiday form with date auto-filled.
              </Typography>
            </CardContent>
          </Card>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'end' }}>
            <CustomInput
              label="Check Date"
              type="date"
              value={checkDate}
              onChange={(event) => setCheckDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <CustomAutocomplete
              label="Check Branch"
              options={branchOptions}
              value={checkBranchId}
              onChange={(value) => setCheckBranchId(value)}
              placeholder="Select branch"
            />
            <Button variant="outlined" onClick={() => void onCheckHoliday()} disabled={checkLoading}>
              {checkLoading ? <CustomLoader size={16} color="inherit" /> : 'Check Holiday'}
            </Button>
            {checkResult ? (
              <Chip
                color={checkResult.is_holiday ? 'warning' : 'success'}
                label={
                  checkResult.is_holiday
                    ? `Holiday (${checkResult.holiday_name || '-'} #${checkResult.holiday_id ?? '-'})`
                    : 'Working day'
                }
              />
            ) : null}
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <CustomTable
            columns={columns}
            rows={items}
            rowKey={(row) => row.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            loading={loading}
            emptyMessage="No holidays found."
            renderRow={(row) => (
              <>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.holiday_date || '-'}</TableCell>
                <TableCell>{row.holiday_type_name || row.holiday_type_id || '-'}</TableCell>
                <TableCell>{row.session_id ?? '-'}</TableCell>
                <TableCell>{row.branch_id ?? 'All'}</TableCell>
                <TableCell>{row.is_optional ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => void onView(row.id)}>
                    <VisibilityRoundedIcon />
                  </IconButton>
                  <IconButton onClick={() => onOpenEdit(row)}>
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
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Create Holiday</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreate} className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
            <CustomInput label="Name" value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} required />
            <CustomInput
              label="Holiday Date"
              type="date"
              value={createForm.holiday_date}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, holiday_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />
            <CustomAutocomplete
              label="Holiday Type"
              options={holidayTypeOptions}
              value={createForm.holiday_type_id || null}
              onChange={(value) => setCreateForm((prev) => ({ ...prev, holiday_type_id: value ?? 0 }))}
              placeholder={loadingOptions ? 'Loading types...' : 'Select type'}
              required
            />
            <CustomAutocomplete
              label="Session"
              options={sessionOptions}
              value={createForm.session_id || null}
              onChange={(value) => setCreateForm((prev) => ({ ...prev, session_id: value ?? 0 }))}
              placeholder={loadingOptions ? 'Loading sessions...' : 'Select session'}
              required
            />
            <CustomAutocomplete
              label="Branch"
              options={branchOptions}
              value={createForm.branch_id}
              onChange={(value) => setCreateForm((prev) => ({ ...prev, branch_id: value }))}
              placeholder="Optional"
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Optional Holiday
              </Typography>
              <Switch checked={createForm.is_optional} onChange={(_, checked) => setCreateForm((prev) => ({ ...prev, is_optional: checked }))} />
            </Stack>
            <Box className="md:col-span-2">
              <CustomInput
                label="Description"
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </Box>
            <Stack direction="row" spacing={1} justifyContent="flex-end" className="md:col-span-2">
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
        <DialogTitle>Update Holiday #{editingId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onUpdate} className="grid gap-3 pt-1">
            <CustomInput
              label="Description"
              value={updateDescription}
              onChange={(event) => setUpdateDescription(event.target.value)}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Optional Holiday
              </Typography>
              <Switch checked={updateOptional} onChange={(_, checked) => setUpdateOptional(checked)} />
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

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Holiday Detail</DialogTitle>
        <DialogContent>
          {!selected ? (
            <CustomLoader label="Loading holiday detail..." />
          ) : (
            <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">{JSON.stringify(selected, null, 2)}</pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HolidaysPage
