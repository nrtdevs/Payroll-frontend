import { Card, CardContent, Typography, useTheme } from '@mui/material'
import { useContext } from 'react'
import { alpha } from '@mui/material/styles'
import { ColorModeContext } from '../context/colorMode'

const cards = [
  { title: 'Branch Management', desc: 'Create and maintain branch records with modal-based forms.' },
  { title: 'Role Management', desc: 'Add roles and maintain your access model centrally.' },
  { title: 'User Management', desc: 'Handle user lifecycle with responsive create, update, and view flows.' },
]

function DashboardPage() {
  const theme = useTheme()
  const { mode } = useContext(ColorModeContext)
  const isDark = mode === 'dark'

  return (
    <div className="space-y-4">
      <Card
        className="!rounded-2xl !text-white"
        sx={{
          border: 'none',
          background: isDark
            ? 'linear-gradient(115deg, #0b1f32 0%, #0f5d67 52%, #155e75 100%)'
            : 'linear-gradient(115deg, #0f766e 0%, #0369a1 52%, #0891b2 100%)',
          boxShadow: isDark ? '0 20px 44px rgba(8, 47, 73, 0.45)' : '0 20px 40px rgba(14, 116, 144, 0.24)',
        }}
      >
        <CardContent className="!p-6 sm:!p-8">
          <Typography variant="h4" className="!font-bold">
            Admin Overview
          </Typography>
          <Typography className="!mt-2" sx={{ color: alpha('#ffffff', 0.88) }}>
            Responsive dashboard powered by Material UI + Tailwind.
          </Typography>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title}>
            <Card
              className="!rounded-2xl h-full"
              sx={{
                backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.92 : 0.96),
                backdropFilter: 'blur(6px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" className="!font-semibold">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="!mt-2">
                  {card.desc}
                </Typography>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
