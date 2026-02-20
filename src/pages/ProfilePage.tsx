import { Avatar, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import useAuth from '../context/useAuth'

const renderValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function ProfilePage() {
  const { authState } = useAuth()
  const user = authState.user

  if (!user) {
    return (
      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h6" className="!font-semibold">
            Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" className="!mt-2">
            User details not available.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const profileRows = [
    { label: 'Employee ID', value: user.id },
    { label: 'Username', value: user.username },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role },
    { label: 'Status', value: user.status },
    { label: 'Business ID', value: user.business_id },
    { label: 'Branch ID', value: user.branch_id },
    { label: 'Role ID', value: user.role_id },
    { label: 'Salary Type', value: user.salary_type },
    { label: 'Salary', value: user.salary },
    { label: 'Leave Balance', value: user.leave_balance },
    { label: 'Mobile', value: user.mobile },
    { label: 'Alternate Number', value: user.number },
    { label: 'PAN', value: user.pan },
    { label: 'Aadhaar', value: user.aadhaar },
    { label: 'Father Name', value: user.father_name },
    { label: 'Mother Name', value: user.mother_name },
    { label: 'Current Address', value: user.current_address },
    { label: 'Home Address', value: user.home_address },
    { label: 'Created At', value: user.created_at },
  ]
  const initials = (user.name || user.username || user.email || 'U').trim().charAt(0).toUpperCase()

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden !rounded-2xl">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-6 text-white">
          <Typography variant="overline" className="!tracking-[0.14em] !text-slate-300">
            Employee Profile
          </Typography>
          <Typography variant="h5" className="!font-semibold">
            {renderValue(user.name)}
          </Typography>
          <Typography variant="body2" className="!mt-1 !text-slate-200">
            Official account details and employee records
          </Typography>
        </div>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Avatar className="!h-16 !w-16 !bg-sky-700 !text-xl !font-semibold">{initials}</Avatar>
            <div>
              <Typography variant="h6" className="!font-semibold">
                {renderValue(user.name)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {renderValue(user.email)}
              </Typography>
            </div>
            <Stack direction="row" spacing={1} className="md:!ml-auto">
              <Chip label={`Role: ${renderValue(user.role)}`} color="primary" variant="outlined" />
              <Chip label={`Status: ${renderValue(user.status)}`} color="success" variant="outlined" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h6" className="!font-semibold">
            Employee Information
          </Typography>
          <Divider className="!my-3" />
          <Grid container spacing={2}>
            {profileRows.map((item) => (
              <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <Typography variant="caption" className="!uppercase !tracking-wide !text-slate-500">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" className="!mt-1 !font-medium !text-slate-800">
                    {renderValue(item.value)}
                  </Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
