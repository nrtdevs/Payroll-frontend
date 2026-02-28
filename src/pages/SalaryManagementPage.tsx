import { Card, CardContent, Typography } from '@mui/material'

function SalaryManagementPage() {
  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Typography variant="h5" className="!font-semibold">
          Salary Management
        </Typography>
        <Typography variant="body2" color="text.secondary" className="!mt-2">
          Define salary structures and manage salary-related settings from this section.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default SalaryManagementPage
