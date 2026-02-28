import { Card, CardContent, Typography } from '@mui/material'

function LeaveManagementPage() {
  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Typography variant="h5" className="!font-semibold">
          Leave Management
        </Typography>
        <Typography variant="body2" color="text.secondary" className="!mt-2">
          Configure leave policies and manage leave balances from this section.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default LeaveManagementPage
