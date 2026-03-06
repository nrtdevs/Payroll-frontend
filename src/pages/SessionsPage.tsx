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
  TableCell,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
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
import { sessionService } from '../services/sessionService'
import type { SessionPayload, SessionRecord, SessionUpdatePayload } from '../services/sessionService'
import { weekendPolicyService } from '../services/weekendPolicyService'
import type { WeekendPolicy, WeekendRulePayload } from '../services/weekendPolicyService'

type WeekendRuleForm = {
  day_of_week: string
  week_number: string
}

type WeekendPolicyForm = {
  session_id: number | null
  name: string
  branch_id: number | null
  is_active: boolean
  rules: WeekendRuleForm[]
}

const initialSessionForm: SessionPayload = {
  name: '',
  start_date: '',
  end_date: '',
  branch_id: null,
  is_active: true,
}

const emptyRule = (): WeekendRuleForm => ({ day_of_week: '', week_number: '' })

const initialPolicyForm: WeekendPolicyForm = {
  session_id: null,
  name: '',
  branch_id: null,
  is_active: true,
  rules: [emptyRule()],
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_OPTIONS: CustomAutocompleteOption<number>[] = DAY_LABELS.map((label, index) => ({
  label: `${label} (${index})`,
  value: index,
}))

const formatDateTime = (value: string): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function SessionsPage() {
  const { showToast } = useToast()

  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [policies, setPolicies] = useState<WeekendPolicy[]>([])

  const [sessionForm, setSessionForm] = useState<SessionPayload>(initialSessionForm)
  const [policyForm, setPolicyForm] = useState<WeekendPolicyForm>(initialPolicyForm)

  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [submittingSession, setSubmittingSession] = useState(false)
  const [submittingPolicy, setSubmittingPolicy] = useState(false)

  const [sessionError, setSessionError] = useState('')
  const [policyError, setPolicyError] = useState('')

  const [createSessionOpen, setCreateSessionOpen] = useState(false)
  const [editSessionOpen, setEditSessionOpen] = useState(false)
  const [createPolicyOpen, setCreatePolicyOpen] = useState(false)
  const [editPolicyOpen, setEditPolicyOpen] = useState(false)
  const [viewPolicyOpen, setViewPolicyOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<WeekendPolicy | null>(null)
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)

  const [sessionPage, setSessionPage] = useState(1)
  const [sessionRowsPerPage, setSessionRowsPerPage] = useState(10)
  const [policyPage, setPolicyPage] = useState(1)
  const [policyRowsPerPage, setPolicyRowsPerPage] = useState(10)

  const [policyBranchFilter, setPolicyBranchFilter] = useState<number | null>(null)
  const [checkDateValue, setCheckDateValue] = useState('')
  const [checkingDate, setCheckingDate] = useState(false)
  const [checkResult, setCheckResult] = useState<{ is_weekend: boolean; session_id: number | null; policy_id: number | null } | null>(null)

  const sessionColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'branch_id', label: 'Branch ID' },
    { key: 'is_active', label: 'Status' },
    { key: 'created_at', label: 'Created At' },
    { key: 'action', label: 'Action', align: 'right', sortable: false },
  ]

  const policyColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Policy Name' },
    { key: 'session_name', label: 'Session' },
    { key: 'branch_id', label: 'Branch ID' },
    { key: 'is_active', label: 'Status' },
    { key: 'action', label: 'Action', align: 'right', sortable: false },
  ]

  const branchOptions: CustomAutocompleteOption<number>[] = useMemo(
    () => branches.map((branch) => ({ value: branch.id, label: `${branch.name} (${branch.id})` })),
    [branches],
  )
  const sessionOptions: CustomAutocompleteOption<number>[] = useMemo(
    () => sessions.map((session) => ({ value: session.id, label: `${session.name} (${session.id})` })),
    [sessions],
  )

  const resetPolicyForm = () => {
    setPolicyForm(initialPolicyForm)
    setEditingPolicyId(null)
  }

  const closePolicyModals = () => {
    setCreatePolicyOpen(false)
    setEditPolicyOpen(false)
    resetPolicyForm()
  }

  const loadSessions = async () => {
    setLoadingSessions(true)
    setSessionError('')
    try {
      const data = await sessionService.listSessions()
      setSessions(data)
      setSessionPage(1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sessions.'
      setSessionError(message)
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadBranches = async () => {
    setLoadingBranches(true)
    try {
      const data = await branchService.getBranches()
      setBranches(data)
    } finally {
      setLoadingBranches(false)
    }
  }

  const loadPolicies = async (branchId = policyBranchFilter) => {
    setLoadingPolicies(true)
    setPolicyError('')
    try {
      const data = await weekendPolicyService.listPolicies(branchId)
      setPolicies(data)
      setPolicyPage(1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load weekend policies.'
      setPolicyError(message)
    } finally {
      setLoadingPolicies(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadSessions(), loadBranches(), loadPolicies(null)])
  }, [])

  const onCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingSession(true)
    setSessionError('')
    try {
      await sessionService.createSession({
        name: sessionForm.name.trim(),
        start_date: sessionForm.start_date,
        end_date: sessionForm.end_date,
        branch_id: sessionForm.branch_id,
        is_active: sessionForm.is_active,
      })
      setCreateSessionOpen(false)
      setSessionForm(initialSessionForm)
      showToast('Session created successfully.', 'success')
      await loadSessions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session.'
      setSessionError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingSession(false)
    }
  }

  const onOpenEditSession = (session: SessionRecord) => {
    setEditingSessionId(session.id)
    setSessionForm({
      name: session.name,
      start_date: session.start_date,
      end_date: session.end_date,
      branch_id: session.branch_id,
      is_active: session.is_active,
    })
    setEditSessionOpen(true)
  }

  const onUpdateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingSessionId === null) return
    setSubmittingSession(true)
    setSessionError('')
    try {
      const payload: SessionUpdatePayload = {
        name: sessionForm.name.trim(),
        start_date: sessionForm.start_date,
        end_date: sessionForm.end_date,
        is_active: sessionForm.is_active,
      }
      if (sessionForm.branch_id !== null) payload.branch_id = sessionForm.branch_id
      await sessionService.updateSession(editingSessionId, payload)
      setEditSessionOpen(false)
      setEditingSessionId(null)
      setSessionForm(initialSessionForm)
      showToast('Session updated successfully.', 'success')
      await Promise.all([loadSessions(), loadPolicies()])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update session.'
      setSessionError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingSession(false)
    }
  }

  const onDeleteSession = async (session: SessionRecord) => {
    const approved = window.confirm(`Delete session "${session.name}"?`)
    if (!approved) return
    setSessionError('')
    try {
      await sessionService.deleteSession(session.id)
      showToast('Session deleted successfully.', 'success')
      await Promise.all([loadSessions(), loadPolicies()])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete session.'
      setSessionError(message)
      showToast(message, 'error')
    }
  }

  const parseRulesPayload = (rules: WeekendRuleForm[]): WeekendRulePayload[] => {
    if (rules.length === 0) throw new Error('At least one rule is required.')

    return rules.map((rule, index) => {
      const inputDay = Number(rule.day_of_week)
      if (!Number.isInteger(inputDay) || inputDay < 0 || inputDay > 7) {
        throw new Error(`Rule ${index + 1}: day_of_week must be between 0 and 7.`)
      }
      const day = inputDay === 7 ? 0 : inputDay

      const weekText = rule.week_number.trim()
      if (weekText === '') return { day_of_week: day, week_number: null }

      const week = Number(weekText)
      if (!Number.isInteger(week) || week < 1 || week > 5) {
        throw new Error(`Rule ${index + 1}: week_number must be 1 to 5 or empty.`)
      }
      return { day_of_week: day, week_number: week }
    })
  }

  const validatePolicySessionAndBranch = (form: WeekendPolicyForm, policySessionId?: number): SessionRecord => {
    const targetSessionId = policySessionId ?? form.session_id
    if (!targetSessionId) throw new Error('Session is required.')

    const session = sessions.find((item) => item.id === targetSessionId)
    if (!session) throw new Error('Selected session not found.')

    const payloadBranchId = form.branch_id ?? null
    const sessionBranchId = session.branch_id ?? null
    if (payloadBranchId !== null && sessionBranchId !== null && sessionBranchId !== payloadBranchId) {
      throw new Error(`branch_id must match selected session branch (${sessionBranchId}) when branch is provided.`)
    }

    return session
  }

  const onCreatePolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingPolicy(true)
    setPolicyError('')
    try {
      validatePolicySessionAndBranch(policyForm)
      const rules = parseRulesPayload(policyForm.rules)
      await weekendPolicyService.createPolicy({
        session_id: policyForm.session_id as number,
        name: policyForm.name.trim(),
        branch_id: policyForm.branch_id,
        rules,
      })
      closePolicyModals()
      showToast('Weekend policy created successfully.', 'success')
      await loadPolicies()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create weekend policy.'
      setPolicyError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingPolicy(false)
    }
  }

  const onOpenEditPolicy = (policy: WeekendPolicy) => {
    setEditingPolicyId(policy.id)
    setPolicyForm({
      session_id: policy.session_id,
      name: policy.name,
      branch_id: policy.branch_id,
      is_active: policy.is_active,
      rules: policy.rules.length
        ? policy.rules.map((rule) => ({
            day_of_week: String(rule.day_of_week),
            week_number: rule.week_number === null ? '' : String(rule.week_number),
          }))
        : [emptyRule()],
    })
    setEditPolicyOpen(true)
  }

  const onUpdatePolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingPolicyId === null) return
    setSubmittingPolicy(true)
    setPolicyError('')
    try {
      validatePolicySessionAndBranch(policyForm, policyForm.session_id ?? undefined)
      const rules = parseRulesPayload(policyForm.rules)
      await weekendPolicyService.updatePolicy(editingPolicyId, {
        name: policyForm.name.trim(),
        branch_id: policyForm.branch_id,
        is_active: policyForm.is_active,
        rules,
      })
      closePolicyModals()
      showToast('Weekend policy updated successfully.', 'success')
      await loadPolicies()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update weekend policy.'
      setPolicyError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingPolicy(false)
    }
  }

  const onDeletePolicy = async (policy: WeekendPolicy) => {
    const approved = window.confirm(`Deactivate weekend policy "${policy.name}"?`)
    if (!approved) return
    setPolicyError('')
    try {
      await weekendPolicyService.deletePolicy(policy.id)
      showToast('Weekend policy deactivated successfully.', 'success')
      await loadPolicies()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete weekend policy.'
      setPolicyError(message)
      showToast(message, 'error')
    }
  }

  const onViewPolicy = async (id: number) => {
    setPolicyError('')
    try {
      const policy = await weekendPolicyService.getPolicyById(id)
      setSelectedPolicy(policy)
      setViewPolicyOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch weekend policy.'
      setPolicyError(message)
      showToast(message, 'error')
    }
  }

  const onCheckDate = async () => {
    if (!checkDateValue) {
      setPolicyError('Check date is required.')
      return
    }
    if (policyBranchFilter === null) {
      setPolicyError('Branch is required for weekend check.')
      return
    }
    setCheckingDate(true)
    setPolicyError('')
    try {
      const data = await weekendPolicyService.checkDate(checkDateValue, policyBranchFilter)
      setCheckResult(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check weekend date.'
      setPolicyError(message)
    } finally {
      setCheckingDate(false)
    }
  }

  const renderPolicyForm = (onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>) => (
    <Box component="form" onSubmit={(event) => void onSubmit(event)} className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
      <CustomInput
        label="Policy Name"
        value={policyForm.name}
        onChange={(event) => setPolicyForm((prev) => ({ ...prev, name: event.target.value }))}
        required
      />
      <CustomAutocomplete
        label="Session"
        options={sessionOptions}
        value={policyForm.session_id}
        onChange={(value) =>
          setPolicyForm((prev) => {
            const selected = sessions.find((session) => session.id === value)
            return {
              ...prev,
              session_id: value,
              branch_id: selected?.branch_id ?? null,
            }
          })
        }
        required
        disabled={editPolicyOpen}
      />
      <CustomAutocomplete
        label="Branch"
        options={branchOptions}
        value={policyForm.branch_id}
        onChange={(value) => setPolicyForm((prev) => ({ ...prev, branch_id: value }))}
        placeholder="Optional"
        disabled={editPolicyOpen}
      />
      <CustomAutocomplete
        label="Active"
        options={[
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ]}
        value={policyForm.is_active}
        onChange={(value) => setPolicyForm((prev) => ({ ...prev, is_active: value ?? true }))}
      />
      <Box className="md:col-span-2 space-y-2">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">Rules (select day, week_number 1-5 or blank)</Typography>
          <Button
            type="button"
            size="small"
            variant="outlined"
            onClick={() => setPolicyForm((prev) => ({ ...prev, rules: [...prev.rules, emptyRule()] }))}
          >
            Add Rule
          </Button>
        </Stack>
        {policyForm.rules.map((rule, index) => (
          <Stack key={`rule-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <CustomAutocomplete
              label={`Rule ${index + 1} Day`}
              options={DAY_OPTIONS}
              value={rule.day_of_week.trim() === '' || Number.isNaN(Number(rule.day_of_week)) ? null : Number(rule.day_of_week)}
              onChange={(value) =>
                setPolicyForm((prev) => {
                  const nextRules = [...prev.rules]
                  nextRules[index] = { ...nextRules[index], day_of_week: value === null ? '' : String(value) }
                  return { ...prev, rules: nextRules }
                })
              }
              placeholder="Select day"
              required
            />
            <CustomInput
              label={`Rule ${index + 1} Week`}
              type="number"
              value={rule.week_number}
              onChange={(event) =>
                setPolicyForm((prev) => {
                  const nextRules = [...prev.rules]
                  nextRules[index] = { ...nextRules[index], week_number: event.target.value }
                  return { ...prev, rules: nextRules }
                })
              }
              placeholder="blank for all weeks"
            />
            <Stack direction="row" alignItems="end">
              <Button
                type="button"
                variant="outlined"
                color="error"
                disabled={policyForm.rules.length === 1}
                onClick={() =>
                  setPolicyForm((prev) => ({
                    ...prev,
                    rules: prev.rules.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              >
                Remove
              </Button>
            </Stack>
          </Stack>
        ))}
      </Box>

      <Stack direction="row" spacing={1} justifyContent="flex-end" className="md:col-span-2">
        <Button
          type="button"
          variant="outlined"
          onClick={closePolicyModals}
          disabled={submittingPolicy}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submittingPolicy}>
          {submittingPolicy ? <CustomLoader size={18} color="inherit" /> : editPolicyOpen ? 'Update Policy' : 'Create Policy'}
        </Button>
      </Stack>
    </Box>
  )

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent className="space-y-3">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <div>
              <Typography variant="h5" className="!font-semibold">
                Session and Weekend Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage sessions and branch weekend policies from one place.
              </Typography>
            </div>
            <Stack direction="row" spacing={1}>
              <Chip label={`Sessions: ${sessions.length}`} variant="outlined" color="primary" />
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateSessionOpen(true)}>
                Create Session
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadSessions()} disabled={loadingSessions}>
                {loadingSessions ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          {sessionError ? <Alert severity="error">{sessionError}</Alert> : null}

          <CustomTable
            columns={sessionColumns}
            rows={sessions}
            rowKey={(session) => session.id}
            page={sessionPage}
            rowsPerPage={sessionRowsPerPage}
            onPageChange={setSessionPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setSessionRowsPerPage(nextRowsPerPage)
              setSessionPage(1)
            }}
            totalRows={sessions.length}
            loading={loadingSessions}
            emptyMessage="No sessions found."
            renderRow={(session) => (
              <>
                <TableCell>{session.id}</TableCell>
                <TableCell>{session.name}</TableCell>
                <TableCell>{session.start_date || '-'}</TableCell>
                <TableCell>{session.end_date || '-'}</TableCell>
                <TableCell>{session.branch_id ?? '-'}</TableCell>
                <TableCell>{session.is_active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>{formatDateTime(session.created_at)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onOpenEditSession(session)}>
                    <EditRoundedIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => void onDeleteSession(session)}>
                    <DeleteRoundedIcon />
                  </IconButton>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent className="space-y-3">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h6" className="!font-semibold">
              Weekend Policies
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreatePolicyOpen(true)}>
                Create Policy
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadPolicies()} disabled={loadingPolicies}>
                {loadingPolicies ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box className="min-w-[260px]">
              <CustomAutocomplete
                label="Filter by Branch"
                options={branchOptions}
                value={policyBranchFilter}
                onChange={(value) => setPolicyBranchFilter(value)}
                placeholder="All branches"
              />
            </Box>
            <Stack direction="row" spacing={1} alignItems="end">
              <Button type="button" variant="contained" onClick={() => void loadPolicies(policyBranchFilter)}>
                Apply Filter
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setPolicyBranchFilter(null)
                  void loadPolicies(null)
                }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'end' }}>
            <Box className="min-w-[260px]">
              <CustomInput
                label="Check Date"
                type="date"
                value={checkDateValue}
                onChange={(event) => setCheckDateValue(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Button variant="outlined" onClick={() => void onCheckDate()} disabled={checkingDate || policyBranchFilter === null || !checkDateValue}>
              {checkingDate ? <CustomLoader size={16} color="inherit" /> : 'Check Weekend'}
            </Button>
            {checkResult ? (
              <Chip
                color={checkResult.is_weekend ? 'warning' : 'success'}
                label={
                  checkResult.is_weekend
                    ? `Weekend (Session: ${checkResult.session_id ?? '-'}, Policy: ${checkResult.policy_id ?? '-'})`
                    : `Working day (Session: ${checkResult.session_id ?? '-'})`
                }
              />
            ) : null}
          </Stack>

          {policyError ? <Alert severity="error">{policyError}</Alert> : null}

          <CustomTable
            columns={policyColumns}
            rows={policies}
            rowKey={(policy) => policy.id}
            page={policyPage}
            rowsPerPage={policyRowsPerPage}
            onPageChange={setPolicyPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setPolicyRowsPerPage(nextRowsPerPage)
              setPolicyPage(1)
            }}
            totalRows={policies.length}
            loading={loadingPolicies}
            emptyMessage="No weekend policies found."
            renderRow={(policy) => (
              <>
                <TableCell>{policy.id}</TableCell>
                <TableCell>{policy.name}</TableCell>
                <TableCell>{policy.session_name}</TableCell>
                <TableCell>{policy.branch_id ?? '-'}</TableCell>
                <TableCell>{policy.is_active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => void onViewPolicy(policy.id)}>
                    <VisibilityRoundedIcon />
                  </IconButton>
                  <IconButton onClick={() => onOpenEditPolicy(policy)}>
                    <EditRoundedIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => void onDeletePolicy(policy)}>
                    <DeleteRoundedIcon />
                  </IconButton>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog
        open={createSessionOpen}
        onClose={() => {
          if (submittingSession) return
          setCreateSessionOpen(false)
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create Session</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSession} className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
            <CustomInput
              label="Session Name"
              value={sessionForm.name}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="2026-2027"
              required
            />
            <CustomAutocomplete
              label="Branch"
              options={branchOptions}
              value={sessionForm.branch_id}
              onChange={(value) => setSessionForm((prev) => ({ ...prev, branch_id: value }))}
              placeholder={loadingBranches ? 'Loading branches...' : 'Select branch'}
              disabled={loadingBranches}
            />
            <CustomInput
              label="Start Date"
              type="date"
              value={sessionForm.start_date}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, start_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />
            <CustomInput
              label="End Date"
              type="date"
              value={sessionForm.end_date}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, end_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />
            <CustomAutocomplete
              label="Active"
              options={[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ]}
              value={sessionForm.is_active}
              onChange={(value) => setSessionForm((prev) => ({ ...prev, is_active: value ?? true }))}
            />
            <Stack direction="row" spacing={1} alignItems="end" justifyContent="flex-end">
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setCreateSessionOpen(false)
                  setSessionForm(initialSessionForm)
                }}
                disabled={submittingSession}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" startIcon={!submittingSession ? <AddRoundedIcon /> : undefined} disabled={submittingSession}>
                {submittingSession ? <CustomLoader size={18} color="inherit" /> : 'Create Session'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editSessionOpen}
        onClose={() => {
          if (submittingSession) return
          setEditSessionOpen(false)
          setEditingSessionId(null)
          setSessionForm(initialSessionForm)
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Update Session #{editingSessionId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onUpdateSession} className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
            <CustomInput
              label="Session Name"
              value={sessionForm.name}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="2026-2027"
              required
            />
            <CustomAutocomplete
              label="Branch"
              options={branchOptions}
              value={sessionForm.branch_id}
              onChange={(value) => setSessionForm((prev) => ({ ...prev, branch_id: value }))}
              placeholder={loadingBranches ? 'Loading branches...' : 'Select branch'}
              disabled={loadingBranches}
            />
            <CustomInput
              label="Start Date"
              type="date"
              value={sessionForm.start_date}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, start_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />
            <CustomInput
              label="End Date"
              type="date"
              value={sessionForm.end_date}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, end_date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
            />
            <CustomAutocomplete
              label="Active"
              options={[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ]}
              value={sessionForm.is_active}
              onChange={(value) => setSessionForm((prev) => ({ ...prev, is_active: value ?? true }))}
            />
            <Stack direction="row" spacing={1} alignItems="end" justifyContent="flex-end">
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setEditSessionOpen(false)
                  setEditingSessionId(null)
                  setSessionForm(initialSessionForm)
                }}
                disabled={submittingSession}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" startIcon={!submittingSession ? <EditRoundedIcon /> : undefined} disabled={submittingSession}>
                {submittingSession ? <CustomLoader size={18} color="inherit" /> : 'Update Session'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createPolicyOpen}
        onClose={() => {
          if (submittingPolicy) return
          closePolicyModals()
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create Weekend Policy</DialogTitle>
        <DialogContent>{renderPolicyForm(onCreatePolicy)}</DialogContent>
      </Dialog>

      <Dialog
        open={editPolicyOpen}
        onClose={() => {
          if (submittingPolicy) return
          closePolicyModals()
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Update Weekend Policy #{editingPolicyId}</DialogTitle>
        <DialogContent>{renderPolicyForm(onUpdatePolicy)}</DialogContent>
      </Dialog>

      <Dialog open={viewPolicyOpen} onClose={() => setViewPolicyOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Weekend Policy Detail</DialogTitle>
        <DialogContent>
          <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
            {JSON.stringify(selectedPolicy, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>

      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Enterprise note: if payroll already used a policy period, backend will block direct update and ask to close old policy then create new one.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            day_of_week is selected from dropdown ({DAY_LABELS.join(', ')}), and week_number supports 1-5 or blank.
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}

export default SessionsPage
