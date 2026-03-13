import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const salaryFlowLinks = [
  { label: 'Salary Components', path: '/admin/salary-components' },
  { label: 'Salary Structures', path: '/admin/salary-structures' },
  { label: 'Employee Salaries', path: '/admin/employee-salaries' },
  { label: 'Payroll Generation', path: '/admin/payroll' },
  { label: 'Payroll Records', path: '/admin/payroll-records' },
  { label: 'Salary Slip', path: '/admin/salary-slip' },
]

function SalaryManagementPage() {
  const navigate = useNavigate()

  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Typography variant="h5" className="!font-semibold">
          Salary Management
        </Typography>
        <Typography variant="body2" color="text.secondary" className="!mt-2">
          Follow the complete salary flow from component setup to salary slip generation.
        </Typography>

        <Stack spacing={1.5} className="!mt-4" direction={{ xs: 'column', sm: 'row' }} useFlexGap flexWrap="wrap">
          {salaryFlowLinks.map((item) => (
            <Button key={item.path} variant="outlined" onClick={() => navigate(item.path)}>
              {item.label}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default SalaryManagementPage
