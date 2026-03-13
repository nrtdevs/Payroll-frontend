import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import useToast from '../context/useToast'
import { userService, type User } from '../services/userService'
import { salaryService } from '../services/salaryService'
import type { SalarySlipResponse } from '../types/salaryTypes'
import { useSearchParams } from 'react-router-dom'

function SalarySlipPage() {
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const [employees, setEmployees] = useState<User[]>([])
  const [employeeId, setEmployeeId] = useState<number | null>(() => {
    const raw = searchParams.get('employeeId')
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  })
  const [month, setMonth] = useState(() => {
    const queryMonth = searchParams.get('month')
    if (queryMonth && /^\d{4}-\d{2}$/.test(queryMonth)) {
      return queryMonth
    }
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingSlip, setLoadingSlip] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState('')
  const [slip, setSlip] = useState<SalarySlipResponse | null>(null)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value)

  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true)
      setError('')
      try {
        const users = await userService.getUsers()
        setEmployees(users)
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Failed to load employees.'
        setError(message)
      } finally {
        setLoadingEmployees(false)
      }
    }

    void loadEmployees()
  }, [])

  const monthLabel = useMemo(() => {
    const [yearString, monthString] = month.split('-')
    const parsedYear = Number(yearString)
    const parsedMonth = Number(monthString)
    if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) return month
    const date = new Date(parsedYear, parsedMonth - 1, 1)
    return date.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  }, [month])

  const onViewSlip = async () => {
    if (!employeeId) {
      setError('Employee is required.')
      return
    }
    if (!month) {
      setError('Month is required.')
      return
    }

    setLoadingSlip(true)
    setError('')
    setSlip(null)
    try {
      const response = await salaryService.getSalarySlip(employeeId, month)
      setSlip(response)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to fetch salary slip.'
      setError(message)
    } finally {
      setLoadingSlip(false)
    }
  }

  const onDownloadPdf = async () => {
    if (!employeeId) {
      setError('Employee is required.')
      return
    }
    if (!month) {
      setError('Month is required.')
      return
    }

    setDownloadingPdf(true)
    setError('')
    try {
      const pdfBlob = await salaryService.downloadSalarySlipPdf(employeeId, month)
      const blobUrl = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `salary_slip_${employeeId}_${month}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
      showToast('Salary slip PDF downloaded successfully.', 'success')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to download salary slip PDF.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loadingEmployees && employees.length === 0) {
    return <CustomLoader fullscreen label="Loading salary slip setup..." />
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Typography variant="h5" className="!font-semibold">
          Salary Slip
        </Typography>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <CustomInput
            label="Employee"
            select
            value={employeeId ?? ''}
            onChange={(event) => setEmployeeId(Number(event.target.value))}
            required
          >
            <MenuItem value="" disabled>
              Select employee
            </MenuItem>
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.name || employee.email || `Employee #${employee.id}`}
              </MenuItem>
            ))}
          </CustomInput>

          <CustomInput label="Month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} required />

          <Stack direction="row" spacing={1} alignItems="end" className="md:col-span-2">
            <Button variant="contained" className="!h-[44px]" onClick={() => void onViewSlip()} disabled={loadingSlip}>
              {loadingSlip ? <CustomLoader size={18} color="inherit" /> : 'View Salary Slip'}
            </Button>
            <Button variant="outlined" className="!h-[44px]" onClick={() => void onDownloadPdf()} disabled={downloadingPdf}>
              {downloadingPdf ? <CustomLoader size={18} color="inherit" /> : 'Download Salary Slip'}
            </Button>
          </Stack>
        </div>

        {error ? (
          <Alert severity="error" className="!mt-3">
            {error}
          </Alert>
        ) : null}

        {slip ? (
          <div className="mt-4 space-y-4">
            <Paper variant="outlined" className="overflow-hidden !rounded-2xl">
              <Box
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 2.3,
                  background: 'linear-gradient(95deg, #0f172a 0%, #1e293b 48%, #334155 100%)',
                  color: '#f8fafc',
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography variant="h6" className="!font-bold !tracking-wide">
                      COMPANY LTD
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(248,250,252,0.78)' }}>
                      Salary Slip for {monthLabel}
                    </Typography>
                  </Box>
                  <Chip label="PAID" size="small" sx={{ fontWeight: 700, bgcolor: '#16a34a', color: '#f0fdf4' }} />
                </Stack>
              </Box>

              <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Employee Name
                    </Typography>
                    <Typography variant="subtitle2" className="!font-semibold">
                      {slip.employee_name || `Employee #${slip.employee_id}`}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Employee ID
                    </Typography>
                    <Typography variant="subtitle2" className="!font-semibold">
                      {slip.employee_id}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Pay Period
                    </Typography>
                    <Typography variant="subtitle2" className="!font-semibold">
                      {monthLabel}
                    </Typography>
                  </div>
                </div>
              </Box>

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Paper variant="outlined" className="!rounded-xl">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: 'rgba(16,185,129,0.12)', fontWeight: 700 } }}>
                          <TableCell>Earnings</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {slip.earnings.map((item, index) => (
                          <TableRow key={`earning-${item.component_name}-${index}`}>
                            <TableCell>{item.component_name}</TableCell>
                            <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '1px dashed', borderColor: 'divider' } }}>
                          <TableCell>Total Earnings</TableCell>
                          <TableCell align="right">{formatCurrency(slip.gross_salary)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>

                  <Paper variant="outlined" className="!rounded-xl">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: 'rgba(239,68,68,0.12)', fontWeight: 700 } }}>
                          <TableCell>Deductions</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {slip.deductions.map((item, index) => (
                          <TableRow key={`deduction-${item.component_name}-${index}`}>
                            <TableCell>{item.component_name}</TableCell>
                            <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '1px dashed', borderColor: 'divider' } }}>
                          <TableCell>Total Deductions</TableCell>
                          <TableCell align="right">{formatCurrency(slip.gross_salary - slip.net_salary)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>
                </div>
              </Box>

              <Box
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'rgba(30,64,175,0.08)',
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Net Payable
                  </Typography>
                  <Typography variant="h6" className="!font-bold !tracking-wide">
                    {formatCurrency(slip.net_salary)}
                  </Typography>
                </Stack>
              </Box>
            </Paper>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default SalarySlipPage
