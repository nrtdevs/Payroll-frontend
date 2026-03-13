import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardContent, Chip, Stack, TableCell, Typography } from '@mui/material'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import PayrollForm from '../components/salary/PayrollForm'
import PayrollDetailsDialog from '../components/salary/PayrollDetailsDialog'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { salaryService } from '../services/salaryService'
import { userService, type User } from '../services/userService'
import type { PayrollRecord } from '../types/salaryTypes'

function PayrollPage() {
  const { showToast } = useToast()
  const [employees, setEmployees] = useState<User[]>([])
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)

  const today = new Date()
  const [form, setForm] = useState({
    employee_id: null as number | null,
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  })

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const columns: CustomTableColumn[] = useMemo(
    () => [
      { key: 'employee_name', label: 'Employee' },
      { key: 'year', label: 'Year' },
      { key: 'month_label', label: 'Month' },
      { key: 'gross_salary', label: 'Gross Salary' },
      { key: 'total_deduction', label: 'Total Deduction' },
      { key: 'net_salary', label: 'Net Salary' },
      { key: 'absent_days', label: 'Absent Days' },
      { key: 'generated_at', label: 'Generated At' },
      { key: 'action', label: 'Action', align: 'right', sortable: false },
    ],
    [],
  )

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true)
      setError('')
      try {
        const users = await userService.getUsers()
        setEmployees(users)
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Failed to load employees.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadEmployees()
  }, [])

  const onGenerate = async () => {
    if (!form.employee_id) {
      setError('Employee is required.')
      return
    }
    if (!Number.isFinite(form.year) || form.year <= 0) {
      setError('Year is invalid.')
      return
    }
    if (!Number.isFinite(form.month) || form.month < 1 || form.month > 12) {
      setError('Month must be between 1 and 12.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await salaryService.generatePayroll({
        employee_id: form.employee_id,
        year: form.year,
        month: form.month,
      })

      const payrollRows = Array.isArray(response.payroll) ? response.payroll : [response.payroll]
      setRecords(payrollRows)
      setPage(1)
      showToast(response.message || 'Payroll generated successfully.', 'success')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to generate payroll.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && employees.length === 0) {
    return <CustomLoader fullscreen label="Loading payroll setup..." />
  }

  const latestRecord = records[0] ?? null
  const formatCurrency = (value: number | undefined) =>
    value === undefined
      ? '-'
      : new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        }).format(value)

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <div
          className="rounded-2xl p-4 md:p-5"
          style={{
            background: 'linear-gradient(126deg, #0f172a 0%, #1d4ed8 55%, #0284c7 100%)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5}>
            <div>
              <Typography variant="h5" className="!font-semibold !text-white">
                Payroll Generation
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(239,246,255,0.88)' }}>
                Generate monthly payroll and instantly view full earning and deduction breakdown.
              </Typography>
            </div>
            {latestRecord ? (
              <Chip
                label={latestRecord.net_salary !== undefined && latestRecord.net_salary < 0 ? 'Negative Net Salary' : 'Payroll Ready'}
                sx={{
                  alignSelf: 'flex-start',
                  fontWeight: 700,
                  color: '#fff',
                  bgcolor: latestRecord.net_salary !== undefined && latestRecord.net_salary < 0 ? '#dc2626' : '#16a34a',
                }}
              />
            ) : null}
          </Stack>
        </div>

        <div className="mt-4">
          <PayrollForm value={form} employees={employees} onChange={setForm} onSubmit={() => void onGenerate()} submitting={submitting} />
        </div>

        {error ? (
          <Alert severity="error" className="!mt-3">
            {error}
          </Alert>
        ) : null}

        {latestRecord ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <Typography variant="caption" color="text.secondary">
                Gross Salary
              </Typography>
              <Typography variant="subtitle1" className="!font-semibold">
                {formatCurrency(latestRecord.gross_salary)}
              </Typography>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <Typography variant="caption" color="text.secondary">
                Total Deductions
              </Typography>
              <Typography variant="subtitle1" className="!font-semibold">
                {formatCurrency(latestRecord.total_deductions ?? latestRecord.total_deduction)}
              </Typography>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <Typography variant="caption" color="text.secondary">
                Net Salary
              </Typography>
              <Typography variant="subtitle1" className="!font-semibold">
                {formatCurrency(latestRecord.net_salary)}
              </Typography>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <Typography variant="caption" color="text.secondary">
                Month
              </Typography>
              <Typography variant="subtitle1" className="!font-semibold">
                {latestRecord.month_label || `${latestRecord.year}-${String(latestRecord.month).padStart(2, '0')}`}
              </Typography>
            </div>
          </div>
        ) : null}

        <CustomTable
          columns={columns}
          rows={records}
          rowKey={(row) => `${row.employee_id ?? 'unknown'}-${row.year}-${row.month}-${row.generated_at ?? ''}-${row.id ?? ''}`}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size)
            setPage(1)
          }}
          emptyMessage="No payroll generated yet."
          loading={submitting}
          renderRow={(row) => (
            <>
              <TableCell>{row.employee_name || `Employee #${row.employee_id ?? '-'}`}</TableCell>
              <TableCell>{row.year}</TableCell>
              <TableCell>{row.month_label || row.month}</TableCell>
              <TableCell>{row.gross_salary?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{(row.total_deductions ?? row.total_deduction)?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{row.net_salary?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{row.absent_days ?? '-'}</TableCell>
              <TableCell>{row.generated_at ?? '-'}</TableCell>
              <TableCell align="right">
                <Button size="small" startIcon={<VisibilityRoundedIcon />} onClick={() => setSelectedRecord(row)}>
                  View
                </Button>
              </TableCell>
            </>
          )}
        />

        <PayrollDetailsDialog open={Boolean(selectedRecord)} record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      </CardContent>
    </Card>
  )
}

export default PayrollPage
