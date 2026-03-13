import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardContent, MenuItem, Stack, TableCell, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import { salaryService } from '../services/salaryService'
import type { PayrollRecord } from '../types/salaryTypes'
import { useNavigate } from 'react-router-dom'
import PayrollDetailsDialog from '../components/salary/PayrollDetailsDialog'

const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

function PayrollRecordsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)

  const currentYear = new Date().getFullYear()
  const [filter, setFilter] = useState({ year: currentYear, month: new Date().getMonth() + 1 })

  const columns: CustomTableColumn[] = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'employee_name', label: 'Employee' },
      { key: 'year', label: 'Year' },
      { key: 'month_label', label: 'Month' },
      { key: 'gross_salary', label: 'Gross Salary' },
      { key: 'total_deduction', label: 'Deductions' },
      { key: 'net_salary', label: 'Net Salary' },
      { key: 'status', label: 'Status' },
      { key: 'action', label: 'Actions', align: 'right', sortable: false },
    ],
    [],
  )

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await salaryService.getPayrollRecords({
        year: filter.year,
        month: filter.month,
      })
      setRecords(response.items)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load payroll records.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const onApplyFilters = () => {
    void loadData()
  }

  if (loading && records.length === 0) {
    return <CustomLoader fullscreen label="Loading payroll records..." />
  }

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Typography variant="h5" className="!font-semibold">
          Payroll Records
        </Typography>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <CustomInput
            label="Year"
            type="number"
            value={filter.year}
            onChange={(event) => setFilter((prev) => ({ ...prev, year: Number(event.target.value) }))}
            inputProps={{ min: 2000, max: 2100 }}
          />

          <CustomInput
            label="Month"
            select
            value={filter.month}
            onChange={(event) => setFilter((prev) => ({ ...prev, month: Number(event.target.value) }))}
          >
            {monthOptions.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </CustomInput>

          <Stack direction="row" spacing={1} alignItems="end">
            <Button variant="contained" className="!h-[44px]" onClick={onApplyFilters} disabled={loading}>
              Apply Filters
            </Button>
            <Button variant="outlined" className="!h-[44px]" startIcon={<RefreshRoundedIcon />} onClick={() => void loadData()} disabled={loading}>
              {loading ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
            </Button>
          </Stack>
        </div>

        {error ? (
          <Alert severity="error" className="!mt-3">
            {error}
          </Alert>
        ) : null}

        <CustomTable
          columns={columns}
          rows={records}
          rowKey={(row) => row.id ?? `${row.employee_id}-${row.year}-${row.month}-${row.generated_at ?? ''}`}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size)
            setPage(1)
          }}
          emptyMessage="No payroll records found for selected filters."
          loading={loading}
          renderRow={(row) => (
            <>
              <TableCell>{row.id ?? '-'}</TableCell>
              <TableCell>{row.employee_name || `Employee #${row.employee_id ?? '-'}`}</TableCell>
              <TableCell>{row.year}</TableCell>
              <TableCell>{row.month_label || monthOptions.find((month) => month.value === row.month)?.label || row.month}</TableCell>
              <TableCell>{row.gross_salary?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{(row.total_deductions ?? row.total_deduction)?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{row.net_salary?.toFixed(2) ?? '-'}</TableCell>
              <TableCell>{row.status || '-'}</TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button size="small" startIcon={<VisibilityRoundedIcon />} onClick={() => setSelectedRecord(row)}>
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ReceiptLongRoundedIcon />}
                    disabled={!row.employee_id}
                    onClick={() =>
                      navigate(
                        `/admin/salary-slip?employeeId=${row.employee_id}&month=${row.year}-${String(row.month).padStart(2, '0')}`,
                      )
                    }
                  >
                    Salary Slip
                  </Button>
                </Stack>
              </TableCell>
            </>
          )}
        />
        <PayrollDetailsDialog open={Boolean(selectedRecord)} record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      </CardContent>
    </Card>
  )
}

export default PayrollRecordsPage
