import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { useParams } from 'react-router-dom'
import CustomLoader from '../components/CustomLoader'
import { salaryService } from '../services/salaryService'
import type { SalaryBreakdownItem, SalaryBreakdownResponse } from '../types/salaryTypes'

function SalaryBreakdownPage() {
  const { employeeId } = useParams()
  const parsedEmployeeId = useMemo(() => Number(employeeId), [employeeId])

  const [data, setData] = useState<SalaryBreakdownResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!Number.isFinite(parsedEmployeeId) || parsedEmployeeId <= 0) {
      setError('Invalid employee id.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await salaryService.getEmployeeSalaryBreakdown(parsedEmployeeId)
      setData(response)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load salary breakdown.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [employeeId])

  const earnings = useMemo(
    () => (data?.breakdown ?? []).filter((item) => (item.type ?? 'EARNING') === 'EARNING'),
    [data?.breakdown],
  )
  const deductions = useMemo(
    () => (data?.breakdown ?? []).filter((item) => item.type === 'DEDUCTION'),
    [data?.breakdown],
  )
  const grossSalary = useMemo(() => earnings.reduce((total, item) => total + item.amount, 0), [earnings])
  const totalDeductions = useMemo(() => deductions.reduce((total, item) => total + item.amount, 0), [deductions])
  const netSalary = useMemo(() => grossSalary - totalDeductions, [grossSalary, totalDeductions])

  const renderRows = (rows: SalaryBreakdownItem[], emptyMessage: string) => {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>
            {emptyMessage}
          </TableCell>
        </TableRow>
      )
    }

    return rows.map((row, index) => (
      <TableRow key={`${row.component_name}-${index}`}>
        <TableCell>{row.component_name}</TableCell>
        <TableCell align="right">{row.amount.toFixed(2)}</TableCell>
      </TableRow>
    ))
  }

  if (loading && !data) {
    return <CustomLoader fullscreen label="Loading salary breakdown..." />
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
          <Typography variant="h5" className="!font-semibold">
            Salary Breakdown
          </Typography>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadData()} disabled={loading}>
            {loading ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" className="!mt-1">
          Employee ID: {Number.isFinite(parsedEmployeeId) ? parsedEmployeeId : '-'}
        </Typography>

        {error ? (
          <Alert severity="error" className="!mt-3">
            {error}
          </Alert>
        ) : null}

        {!error && data ? (
          <div className="mt-4 space-y-4">
            <Typography variant="subtitle2" color="text.secondary">
              {data.employee_name ? `Employee: ${data.employee_name}` : 'Employee name unavailable'}
            </Typography>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Earnings</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{renderRows(earnings, 'No earnings available.')}</TableBody>
              </Table>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Deductions</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{renderRows(deductions, 'No deductions available.')}</TableBody>
              </Table>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <Typography variant="body2">Gross Salary: {grossSalary.toFixed(2)}</Typography>
              <Typography variant="body2">Total Deductions: {totalDeductions.toFixed(2)}</Typography>
              <Typography variant="subtitle1" className="!font-semibold">
                Net Salary: {netSalary.toFixed(2)}
              </Typography>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default SalaryBreakdownPage
