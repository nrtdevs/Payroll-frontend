import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Alert, Button, Card, CardContent, Chip, Stack, TableCell, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import CustomAutocomplete, { type CustomAutocompleteOption } from '../components/CustomAutocomplete'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { branchService } from '../services/branchService'
import { attendanceService } from '../services/attendanceService'
import { userService } from '../services/userService'
import type { AttendanceListFilters, AttendanceRecord } from '../services/attendanceService'
import type { Branch } from '../services/branchService'
import type { User } from '../services/userService'

const formatDateTime = (value: string | null): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const ATTENDANCE_STATUS_OPTIONS: Array<CustomAutocompleteOption<string>> = [
  { label: 'PRESENT', value: 'PRESENT' },
  { label: 'ABSENT', value: 'ABSENT' },
  { label: 'OVERTIME', value: 'OVERTIME' },
  { label: 'HALFDAY', value: 'HALFDAY' },
]

function AttendancePage() {
  const { showToast } = useToast()
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRecord[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)
  const [submittingCheckOut, setSubmittingCheckOut] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [resolvingMeta, setResolvingMeta] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalAttendance, setTotalAttendance] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [filterDraft, setFilterDraft] = useState({
    start_date: '',
    end_date: '',
    user_id: null as number | null,
    branch_id: null as number | null,
    status: null as string | null,
  })
  const [filters, setFilters] = useState<AttendanceListFilters>({
    start_date: '',
    end_date: '',
    user_id: null,
    branch_id: null,
    status: undefined,
  })

  const userOptions: CustomAutocompleteOption<number>[] = users.map((user) => ({
    value: user.id,
    label: `${user.name || user.username || user.email || `User ${user.id}`} (${user.id})`,
  }))
  const branchOptions: CustomAutocompleteOption<number>[] = branches.map((branch) => ({
    value: branch.id,
    label: `${branch.name} (${branch.id})`,
  }))

  const attendanceColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    { key: 'check_in', label: 'Check In' },
    { key: 'check_out', label: 'Check Out' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'ip_address', label: 'IP Address' },
  ]

  const loadAttendance = async () => {
    setLoadingAttendance(true)
    setAttendanceError('')
    try {
      const data = await attendanceService.getAttendanceList(page, rowsPerPage, filters)
      setAttendanceRows(data.items)
      setTotalAttendance(data.total)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load attendance.'
      setAttendanceError(message)
    } finally {
      setLoadingAttendance(false)
    }
  }

  useEffect(() => {
    void loadAttendance()
  }, [page, rowsPerPage, filters])

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [usersData, branchesData] = await Promise.all([userService.getUsers(), branchService.getBranches()])
        setUsers(usersData)
        setBranches(branchesData)
      } catch {
        // Keep page usable even if dropdown options fail.
      }
    }
    void loadFilterOptions()
  }, [])

  const resolveAttendanceMeta = async (): Promise<{ latitude: string; longitude: string; ipAddress: string }> => {
    setResolvingMeta(true)
    let nextLatitude = latitude
    let nextLongitude = longitude
    let nextIpAddress = ipAddress
    try {
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              nextLatitude = String(position.coords.latitude)
              nextLongitude = String(position.coords.longitude)
              setLatitude(nextLatitude)
              setLongitude(nextLongitude)
              resolve()
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
          )
        })
      }

      try {
        const response = await fetch('https://api.ipify.org?format=json')
        if (response.ok) {
          const data = (await response.json()) as { ip?: string }
          if (data.ip) {
            nextIpAddress = data.ip
            setIpAddress(nextIpAddress)
          }
        }
      } catch {
        // Ignore ip fetch failures and let backend validation handle it.
      }
    } finally {
      setResolvingMeta(false)
    }
    return { latitude: nextLatitude, longitude: nextLongitude, ipAddress: nextIpAddress }
  }

  useEffect(() => {
    void resolveAttendanceMeta()
  }, [])

  const onPickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null
    setFile(picked)
  }

  const onSubmitCheckIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      showToast('Please select a selfie image file.', 'error')
      return
    }
    if (!file.type.toLowerCase().startsWith('image/')) {
      showToast('Only image files are allowed.', 'error')
      return
    }
    setSubmittingCheckIn(true)
    setAttendanceError('')
    try {
      const resolved = await resolveAttendanceMeta()
      const finalLatitude = (resolved.latitude || latitude || '0').trim()
      const finalLongitude = (resolved.longitude || longitude || '0').trim()
      const finalIpAddress = (resolved.ipAddress || ipAddress || '0.0.0.0').trim()

      const message = await attendanceService.checkIn({
        file,
        latitude: finalLatitude,
        longitude: finalLongitude,
        ip_address: finalIpAddress,
      })
      showToast(message || 'Check-in successful.', 'success')
      setFile(null)
      await loadAttendance()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-in failed.'
      setAttendanceError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  const onCheckOut = async () => {
    setSubmittingCheckOut(true)
    setAttendanceError('')
    try {
      const message = await attendanceService.checkOut()
      showToast(message || 'Check-out successful.', 'success')
      await loadAttendance()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-out failed.'
      setAttendanceError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingCheckOut(false)
    }
  }

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setFilters({
      start_date: filterDraft.start_date.trim(),
      end_date: filterDraft.end_date.trim(),
      user_id: filterDraft.user_id,
      branch_id: filterDraft.branch_id,
      status: filterDraft.status ?? undefined,
    })
  }

  const onResetFilters = () => {
    setPage(1)
    setFilterDraft({
      start_date: '',
      end_date: '',
      user_id: null,
      branch_id: null,
      status: null,
    })
    setFilters({
      start_date: '',
      end_date: '',
      user_id: null,
      branch_id: null,
      status: undefined,
    })
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent className="space-y-3">
          <Typography variant="h5" className="!font-semibold">
            Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check-in with selfie, location and IP, then check-out when your shift is done.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <Chip label={`Records: ${totalAttendance}`} variant="outlined" color="primary" />
          </Stack>

          <form onSubmit={onSubmitCheckIn} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-4">
              <Button variant="outlined" component="label" disabled={submittingCheckIn || submittingCheckOut}>
                Choose Selfie
                <input hidden type="file" accept="image/*" onChange={onPickFile} />
              </Button>
              <Typography variant="caption" color="text.secondary" className="!ml-2">
                {file ? file.name : 'No file selected'}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" color="text.secondary">
                Latitude
              </Typography>
              <Typography variant="body2">{latitude || (resolvingMeta ? 'Detecting...' : '-')}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">
                Longitude
              </Typography>
              <Typography variant="body2">{longitude || (resolvingMeta ? 'Detecting...' : '-')}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">
                IP Address
              </Typography>
              <Typography variant="body2">{ipAddress || (resolvingMeta ? 'Detecting...' : '-')}</Typography>
            </div>

            <Stack direction="row" spacing={1} alignItems="end">
              <Button type="submit" variant="contained" disabled={submittingCheckIn || submittingCheckOut}>
                {submittingCheckIn ? <CustomLoader size={18} color="inherit" /> : 'Check In'}
              </Button>
              <Button type="button" variant="outlined" onClick={() => void resolveAttendanceMeta()} disabled={resolvingMeta}>
                {resolvingMeta ? <CustomLoader size={18} color="inherit" /> : 'Detect Again'}
              </Button>
              <Button type="button" variant="outlined" disabled={submittingCheckIn || submittingCheckOut} onClick={() => void onCheckOut()}>
                {submittingCheckOut ? <CustomLoader size={18} color="inherit" /> : 'Check Out'}
              </Button>
            </Stack>
          </form>

          {attendanceError ? <Alert severity="error">{attendanceError}</Alert> : null}
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h6" className="!font-semibold">
              Attendance List
            </Typography>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadAttendance()} disabled={loadingAttendance}>
              {loadingAttendance ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
            </Button>
          </Stack>

          <form onSubmit={onFilterSubmit} className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <CustomInput
              label="Start Date"
              type="date"
              value={filterDraft.start_date}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, start_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <CustomInput
              label="End Date"
              type="date"
              value={filterDraft.end_date}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, end_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <CustomAutocomplete
              label="User"
              options={userOptions}
              value={filterDraft.user_id}
              onChange={(value) => setFilterDraft((prev) => ({ ...prev, user_id: value }))}
              placeholder="Select user"
            />
            <CustomAutocomplete
              label="Branch"
              options={branchOptions}
              value={filterDraft.branch_id}
              onChange={(value) => setFilterDraft((prev) => ({ ...prev, branch_id: value }))}
              placeholder="Select branch"
            />
            <CustomAutocomplete
              label="Status"
              options={ATTENDANCE_STATUS_OPTIONS}
              value={filterDraft.status}
              onChange={(value) => setFilterDraft((prev) => ({ ...prev, status: value }))}
              placeholder="Select status"
            />
            <Stack direction="row" spacing={1} alignItems="end">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply
              </Button>
              <Button type="button" variant="outlined" className="!h-[44px]" onClick={onResetFilters}>
                Reset
              </Button>
            </Stack>
          </form>

          <CustomTable
            columns={attendanceColumns}
            rows={attendanceRows}
            rowKey={(row) => row.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            loading={loadingAttendance}
            totalRows={totalAttendance}
            paginateRows={false}
            emptyMessage="No attendance records found."
            renderRow={(row) => (
              <>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.status || '-'}</TableCell>
                <TableCell>{formatDateTime(row.check_in)}</TableCell>
                <TableCell>{formatDateTime(row.check_out)}</TableCell>
                <TableCell>{row.latitude || '-'}</TableCell>
                <TableCell>{row.longitude || '-'}</TableCell>
                <TableCell>{row.ip_address || '-'}</TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default AttendancePage
