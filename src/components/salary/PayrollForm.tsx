import { Button, MenuItem, Stack } from '@mui/material'
import type { User } from '../../services/userService'
import CustomInput from '../CustomInput'
import CustomLoader from '../CustomLoader'

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

type PayrollFormValue = {
  employee_id: number | null
  year: number
  month: number
}

type PayrollFormProps = {
  value: PayrollFormValue
  employees: User[]
  onChange: (next: PayrollFormValue) => void
  onSubmit: () => void
  submitting: boolean
}

function PayrollForm({ value, employees, onChange, onSubmit, submitting }: PayrollFormProps) {
  return (
    <form
      className="grid gap-3 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <CustomInput
        label="Employee"
        select
        value={value.employee_id ?? ''}
        onChange={(event) => onChange({ ...value, employee_id: Number(event.target.value) })}
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

      <CustomInput
        label="Year"
        type="number"
        value={value.year}
        onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}
        required
        inputProps={{ min: 2000, max: 2100 }}
      />

      <CustomInput
        label="Month"
        select
        value={value.month}
        onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}
        required
      >
        {monthOptions.map((month) => (
          <MenuItem key={month.value} value={month.value}>
            {month.label}
          </MenuItem>
        ))}
      </CustomInput>

      <Stack direction="row" alignItems="end">
        <Button type="submit" variant="contained" className="!h-[44px]" disabled={submitting}>
          {submitting ? <CustomLoader size={18} color="inherit" /> : 'Generate Payroll'}
        </Button>
      </Stack>
    </form>
  )
}

export default PayrollForm
