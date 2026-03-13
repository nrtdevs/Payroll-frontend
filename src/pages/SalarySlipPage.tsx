import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
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

  const totalDaysInMonth = useMemo(() => {
    const [yearString, monthString] = month.split('-')
    const parsedYear = Number(yearString)
    const parsedMonth = Number(monthString)
    if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) return '-'
    return String(new Date(parsedYear, parsedMonth, 0).getDate())
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

  const totalDeductions = slip ? slip.deductions.reduce((sum, item) => sum + item.amount, 0) : 0
  const rowCount = slip ? Math.max(slip.earnings.length, slip.deductions.length) : 0

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
          <div className="mt-4">
            <Paper variant="outlined" className="overflow-hidden" sx={{ maxWidth: 980, mx: 'auto', borderColor: '#9ca3af' }}>
              <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#fff' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 68,
                        height: 68,
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#f59e0b',
                        fontSize: '1.7rem',
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      nr
                    </Box>
                    <Box>
                      <Typography variant="body2" className="!font-bold !tracking-wide">
                        NEWRISE TECHNOSYS PVT. LTD.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pay Slip for the Month of {monthLabel}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    System generated document
                  </Typography>
                </Stack>

                <Box sx={{ border: '1px solid #9ca3af', mt: 2 }}>
                  <Table size="small" sx={{ '& td, & th': { border: '1px solid #9ca3af !important' } }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                        <TableCell>{slip.employee_name || `Employee #${slip.employee_id}`}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                        <TableCell>{slip.employee_id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Month Days</TableCell>
                        <TableCell>{totalDaysInMonth}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Pay Period</TableCell>
                        <TableCell>{monthLabel}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>

                <Box sx={{ border: '1px solid #9ca3af', borderTop: 0 }}>
                  <Table size="small" sx={{ '& td, & th': { border: '1px solid #9ca3af !important' } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#f3f4f6' }}>Earnings</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#f3f4f6' }} align="right">
                          Actual (Rs.)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#f3f4f6' }}>Deductions</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#f3f4f6' }} align="right">
                          Amount (Rs.)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from({ length: rowCount }).map((_, index) => {
                        const earning = slip.earnings[index]
                        const deduction = slip.deductions[index]
                        return (
                          <TableRow key={`slip-row-${index}`}>
                            <TableCell>{earning?.component_name ?? '-'}</TableCell>
                            <TableCell align="right">{earning ? formatCurrency(earning.amount) : '-'}</TableCell>
                            <TableCell>{deduction?.component_name ?? '-'}</TableCell>
                            <TableCell align="right">{deduction ? formatCurrency(deduction.amount) : '-'}</TableCell>
                          </TableRow>
                        )
                      })}

                      <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: '#f9fafb' } }}>
                        <TableCell>Total Gross</TableCell>
                        <TableCell align="right">{formatCurrency(slip.gross_salary)}</TableCell>
                        <TableCell>Total Deduction</TableCell>
                        <TableCell align="right">{formatCurrency(totalDeductions)}</TableCell>
                      </TableRow>

                      <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: '#e5f3ff' } }}>
                        <TableCell colSpan={3}>Net Pay</TableCell>
                        <TableCell align="right">{formatCurrency(slip.net_salary)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>

                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    This is system generated salary slip and does not require signature.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default SalarySlipPage
