import { Card, CardContent, Typography } from '@mui/material'

function MasterSettingPage() {
  return (
    <Card className="!rounded-2xl">
      <CardContent>
        <Typography variant="h5" className="!font-semibold">
          Master Setting
        </Typography>
        <Typography variant="body2" color="text.secondary" className="!mt-2">
          Manage master-level settings from this section.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default MasterSettingPage
