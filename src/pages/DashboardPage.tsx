import { Card, CardContent, Typography } from '@mui/material'

const cards = [
  { title: 'Branch Management', desc: 'Create and maintain branch records with modal-based forms.' },
  { title: 'Role Management', desc: 'Add roles and maintain your access model centrally.' },
  { title: 'User Management', desc: 'Handle user lifecycle with responsive create, update, and view flows.' },
]

function DashboardPage() {
  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl !bg-gradient-to-r !from-slate-900 !to-cyan-900 !text-white">
        <CardContent className="!p-6 sm:!p-8">
          <Typography variant="h4" className="!font-bold">
            Admin Overview
          </Typography>
          <Typography className="!mt-2 !text-slate-100">
            Responsive dashboard powered by Material UI + Tailwind.
          </Typography>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title}>
            <Card className="!rounded-2xl h-full">
              <CardContent>
                <Typography variant="h6" className="!font-semibold !text-slate-800">
                  {card.title}
                </Typography>
                <Typography variant="body2" className="!mt-2 !text-slate-600">
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
