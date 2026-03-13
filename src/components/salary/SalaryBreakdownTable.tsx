import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { SalaryBreakdownItem } from '../../types/salaryTypes'

type SalaryBreakdownTableProps = {
  rows: SalaryBreakdownItem[]
}

function SalaryBreakdownTable({ rows }: SalaryBreakdownTableProps) {
  if (rows.length === 0) {
    return <Typography color="text.secondary">No breakdown available.</Typography>
  }

  return (
    <Table size="small" sx={{ minWidth: 420 }}>
      <TableHead>
        <TableRow>
          <TableCell>Component</TableCell>
          <TableCell>Type</TableCell>
          <TableCell align="right">Amount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={`${row.component_name}-${index}`}>
            <TableCell>{row.component_name}</TableCell>
            <TableCell>{row.type ?? '-'}</TableCell>
            <TableCell align="right">{row.amount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default SalaryBreakdownTable
