import { useEffect, useMemo, useState } from 'react'
import { Alert, Card, CardContent, TableCell, Typography } from '@mui/material'
import PayrollForm from '../components/salary/PayrollForm'
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
      { key: 'month', label: 'Month' },
      { key: 'gross_salary', label: 'Gross Salary' },
      { key: 'total_deduction', label: 'Total Deduction' },
      { key: 'net_salary', label: 'Net Salary' },
      { key: 'generated_at', label: 'Generated At' },
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

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Typography variant="h5" className="!font-semibold">
          Payroll Generation
        </Typography>

        <div className="mt-4">
          <PayrollForm value={form} employees={employees} onChange={setForm} onSubmit={() => void onGenerate()} submitting={submitting} />
        </div>

        {error ? (
          <Alert severity="error" className="!mt-3">
            {error}
          </Alert>
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
              <TableCell>{row.month}</TableCell>
              <TableCell>{row.gross_salary?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{row.total_deduction?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{row.net_salary?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{row.generated_at ?? '-'}</TableCell>
            </>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default PayrollPage
