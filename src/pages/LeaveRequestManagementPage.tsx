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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import CustomAutocomplete, { type CustomAutocompleteOption } from '../components/CustomAutocomplete'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { leaveTypeService } from '../services/leaveTypeService'
import { leaveRequestService } from '../services/leaveRequestService'
import type { ApplyLeaveRequestPayload, LeaveRequest } from '../services/leaveRequestService'
import type { LeaveType } from '../services/leaveTypeService'

type ApplyFormState = {
  leave_type_id: number | null
  start_date: string
  end_date: string
  reason: string
  proof_file_path: string
}

const emptyApplyForm: ApplyFormState = {
  leave_type_id: null,
  start_date: '',
  end_date: '',
  reason: '',
  proof_file_path: '',
}

function LeaveRequestManagementPage() {
  const { showToast } = useToast()
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([])
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [applyForm, setApplyForm] = useState<ApplyFormState>(emptyApplyForm)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const [myPage, setMyPage] = useState(1)
  const [teamPage, setTeamPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const leaveTypeOptions: CustomAutocompleteOption<number>[] = useMemo(
    () => leaveTypes.map((item) => ({ label: `${item.name} (#${item.id})`, value: item.id })),
    [leaveTypes],
  )

  const requestColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'leave_type_name', label: 'Leave Type' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const teamColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'user_name', label: 'Employee' },
    { key: 'leave_type_name', label: 'Leave Type' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [leaveTypeData, myRequestData, teamRequestData] = await Promise.all([
        leaveTypeService.getLeaveTypes(),
        leaveRequestService.getMyRequests(),
        leaveRequestService.getTeamPendingRequests(),
      ])
      setLeaveTypes(leaveTypeData)
      setMyRequests(myRequestData)
      setTeamRequests(teamRequestData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave management data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const onApplyLeave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (applyForm.leave_type_id === null) {
      const message = 'Leave type is required.'
      setError(message)
      showToast(message, 'error')
      return
    }
    if (!applyForm.start_date || !applyForm.end_date || !applyForm.reason.trim()) {
      const message = 'Start date, end date and reason are required.'
      setError(message)
      showToast(message, 'error')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const payload: ApplyLeaveRequestPayload = {
        leave_type_id: applyForm.leave_type_id,
        start_date: applyForm.start_date,
        end_date: applyForm.end_date,
        reason: applyForm.reason.trim(),
        proof_file_path: applyForm.proof_file_path.trim() || undefined,
      }
      await leaveRequestService.applyLeave(payload)
      showToast('Leave request applied successfully.', 'success')
      setApplyForm(emptyApplyForm)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply leave request.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onApprove = async (id: number) => {
    setSubmitting(true)
    setError('')
    try {
      await leaveRequestService.approveRequest(id)
      showToast('Leave request approved.', 'success')
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve leave request.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onOpenRejectDialog = (id: number) => {
    setRejectingRequestId(id)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  const onReject = async () => {
    if (rejectingRequestId === null) return
    if (!rejectionReason.trim()) {
      const message = 'Rejection reason is required.'
      setError(message)
      showToast(message, 'error')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await leaveRequestService.rejectRequest(rejectingRequestId, { rejection_reason: rejectionReason.trim() })
      showToast('Leave request rejected.', 'success')
      setRejectDialogOpen(false)
      setRejectingRequestId(null)
      setRejectionReason('')
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject leave request.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && myRequests.length === 0 && teamRequests.length === 0) {
    return <CustomLoader fullscreen label="Loading leave management..." />
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              Leave Management
            </Typography>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadData()} disabled={loading}>
              {loading ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
            </Button>
          </Stack>
          {error ? (
            <Alert severity="error" className="!mt-3">
              {error}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h6" className="!font-semibold">
            Apply Leave
          </Typography>
          <Box component="form" onSubmit={onApplyLeave} className="!mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <CustomAutocomplete
              label="Leave Type"
              options={leaveTypeOptions}
              value={applyForm.leave_type_id}
              required
              requiredMessage="Leave Type is required."
              onChange={(value) => setApplyForm((prev) => ({ ...prev, leave_type_id: value }))}
            />
            <CustomInput
              label="Proof File Path"
              value={applyForm.proof_file_path}
              onChange={(event) => setApplyForm((prev) => ({ ...prev, proof_file_path: event.target.value }))}
              placeholder="storage/uploads/5/medical.pdf"
            />
            <CustomInput
              label="Start Date"
              type="date"
              value={applyForm.start_date}
              onChange={(event) => setApplyForm((prev) => ({ ...prev, start_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />
            <CustomInput
              label="End Date"
              type="date"
              value={applyForm.end_date}
              onChange={(event) => setApplyForm((prev) => ({ ...prev, end_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />
            <div className="md:col-span-2">
              <CustomInput
                label="Reason"
                value={applyForm.reason}
                onChange={(event) => setApplyForm((prev) => ({ ...prev, reason: event.target.value }))}
                required
                multiline
                minRows={3}
              />
            </div>
            <Stack direction="row" justifyContent="flex-end" className="md:col-span-2">
              <Button type="submit" variant="contained" startIcon={<SendRoundedIcon />} disabled={submitting}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : 'Submit Leave Request'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h6" className="!font-semibold">
            My Requests
          </Typography>
          <CustomTable
            columns={requestColumns}
            rows={myRequests}
            rowKey={(item) => item.id}
            page={myPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setMyPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setMyPage(1)
            }}
            emptyMessage="No leave requests found."
            loading={loading}
            renderRow={(item) => (
              <>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.leave_type_name || '-'}</TableCell>
                <TableCell>{item.start_date || '-'}</TableCell>
                <TableCell>{item.end_date || '-'}</TableCell>
                <TableCell>{item.status || '-'}</TableCell>
                <TableCell align="right">-</TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h6" className="!font-semibold">
            Team Pending Requests
          </Typography>
          <CustomTable
            columns={teamColumns}
            rows={teamRequests}
            rowKey={(item) => item.id}
            page={teamPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setTeamPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setTeamPage(1)
            }}
            emptyMessage="No team pending requests."
            loading={loading}
            renderRow={(item) => (
              <>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.user_name || '-'}</TableCell>
                <TableCell>{item.leave_type_name || '-'}</TableCell>
                <TableCell>{item.start_date || '-'}</TableCell>
                <TableCell>{item.end_date || '-'}</TableCell>
                <TableCell>{item.status || '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Approve">
                    <IconButton color="success" disabled={submitting} onClick={() => void onApprove(item.id)}>
                      <CheckCircleRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reject">
                    <IconButton color="error" disabled={submitting} onClick={() => onOpenRejectDialog(item.id)}>
                      <CloseRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Leave Request #{rejectingRequestId}</DialogTitle>
        <DialogContent>
          <Box className="grid gap-3 pt-1">
            <CustomInput
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              required
              multiline
              minRows={3}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="outlined" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="contained" color="error" disabled={submitting} onClick={() => void onReject()}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : 'Reject'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LeaveRequestManagementPage
