import { FormControl, MenuItem, Pagination, Select, Stack, Typography } from '@mui/material'

type CustomPaginationBarProps = {
  page: number
  rowsPerPage: number
  totalRows: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  rowsPerPageOptions?: number[]
}

function CustomPaginationBar({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 20, 50],
}: CustomPaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = totalRows === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const end = Math.min(safePage * rowsPerPage, totalRows)

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      spacing={1.5}
      className="!mt-3"
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" className="!text-slate-600">
          Rows per page
        </Typography>
        <FormControl size="small">
          <Select value={String(rowsPerPage)} onChange={(event) => onRowsPerPageChange(Number(event.target.value))}>
            {rowsPerPageOptions.map((option) => (
              <MenuItem key={option} value={String(option)}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" className="!text-slate-600">
          {start}-{end} of {totalRows}
        </Typography>
      </Stack>
      <Pagination count={totalPages} page={safePage} onChange={(_, nextPage) => onPageChange(nextPage)} color="primary" shape="rounded" />
    </Stack>
  )
}

export default CustomPaginationBar
