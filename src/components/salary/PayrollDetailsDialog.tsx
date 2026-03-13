import { Box, Chip, Dialog, DialogContent, DialogTitle, Divider, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { PayrollRecord } from '../../types/salaryTypes'

type PayrollDetailsDialogProps = {
  open: boolean
  record: PayrollRecord | null
  onClose: () => void
}

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

const formatNumber = (value: number | undefined) => (value === undefined ? '-' : value)

function PayrollDetailsDialog({ open, record, onClose }: PayrollDetailsDialogProps) {
  if (!record) return null

  const totalDeductions = record.total_deductions ?? record.total_deduction
  const monthLabel = record.month_label || `${record.year}-${String(record.month).padStart(2, '0')}`
  const statusLabel = record.status?.toUpperCase() || 'GENERATED'
  const statusColor = statusLabel === 'PAID' ? '#15803d' : '#2563eb'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="h6" className="!font-semibold">
              Payroll Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record.employee_name || `Employee #${record.employee_id ?? '-'}`} | {monthLabel}
            </Typography>
          </Box>
          <Chip label={statusLabel} size="small" sx={{ color: '#fff', bgcolor: statusColor, fontWeight: 700 }} />
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: 2,
            background: 'linear-gradient(145deg, rgba(2,132,199,0.08) 0%, rgba(37,99,235,0.02) 60%, rgba(255,255,255,0.6) 100%)',
          }}
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Typography variant="caption" color="text.secondary">
                Gross Salary
              </Typography>
              <Typography variant="subtitle2" className="!font-semibold">
                {formatCurrency(record.gross_salary)}
              </Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">
                Total Deductions
              </Typography>
              <Typography variant="subtitle2" className="!font-semibold">
                {formatCurrency(totalDeductions)}
              </Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">
                Net Salary
              </Typography>
              <Typography variant="subtitle2" className="!font-semibold">
                {formatCurrency(record.net_salary)}
              </Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">
                Per Day Salary
              </Typography>
              <Typography variant="subtitle2" className="!font-semibold">
                {formatCurrency(record.per_day_salary)}
              </Typography>
            </div>
          </div>
        </Paper>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <Typography variant="caption" color="text.secondary">
              Working Days
            </Typography>
            <Typography variant="body2" className="!font-semibold">
              {formatNumber(record.working_days)}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Present Days
            </Typography>
            <Typography variant="body2" className="!font-semibold">
              {formatNumber(record.present_days)}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Leave Days
            </Typography>
            <Typography variant="body2" className="!font-semibold">
              {formatNumber(record.leave_days)}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Absent Days
            </Typography>
            <Typography variant="body2" className="!font-semibold">
              {formatNumber(record.absent_days)}
            </Typography>
          </div>
        </div>

        {(record.earnings?.length || record.deductions?.length) ? (
          <>
            <Divider sx={{ my: 2 }} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Paper variant="outlined" className="!rounded-xl">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: 'rgba(16,185,129,0.12)', fontWeight: 700 } }}>
                      <TableCell>Earnings</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(record.earnings ?? []).map((item, index) => (
                      <TableRow key={`earning-${item.component_name}-${index}`}>
                        <TableCell>{item.component_name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
              <Paper variant="outlined" className="!rounded-xl">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: 'rgba(239,68,68,0.12)', fontWeight: 700 } }}>
                      <TableCell>Deductions</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(record.deductions ?? []).map((item, index) => (
                      <TableRow key={`deduction-${item.component_name}-${index}`}>
                        <TableCell>{item.component_name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default PayrollDetailsDialog
