import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material'
import CustomPaginationBar from './CustomPaginationBar'
import CustomLoader from './CustomLoader'

export type CustomTableColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  sortAccessor?: (row: unknown) => string | number | boolean | null | undefined
}

type CustomTableProps<T> = {
  columns: CustomTableColumn[]
  rows: T[]
  rowKey: (row: T) => string | number
  renderRow: (row: T) => ReactNode
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  emptyMessage: string
  paginateRows?: boolean
  totalRows?: number
  loading?: boolean
}

function CustomTable<T>({
  columns,
  rows,
  rowKey,
  renderRow,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage,
  paginateRows = true,
  totalRows,
  loading = false,
}: CustomTableProps<T>) {
  const firstSortableColumnKey = useMemo(
    () => columns.find((column) => (column.sortable ?? column.key !== 'action'))?.key ?? null,
    [columns],
  )
  const [sortKey, setSortKey] = useState<string | null>(firstSortableColumnKey)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const effectiveSortKey = useMemo(() => {
    const sortColumnStillExists = sortKey ? columns.some((column) => column.key === sortKey) : false
    return sortColumnStillExists ? sortKey : firstSortableColumnKey
  }, [columns, firstSortableColumnKey, sortKey])
  const effectiveSortDirection: 'asc' | 'desc' = effectiveSortKey === sortKey ? sortDirection : 'asc'

  const getValueByKey = (row: unknown, key: string): unknown => {
    if (!row || typeof row !== 'object') return undefined
    const objectRow = row as Record<string, unknown>
    return objectRow[key]
  }

  const normalizeSortValue = (value: unknown): string | number => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'number') return value
    if (typeof value === 'boolean') return value ? 1 : 0
    return String(value).toLowerCase()
  }

  const sortedRows = useMemo(() => {
    if (!effectiveSortKey) return rows

    const sortColumn = columns.find((column) => column.key === effectiveSortKey)
    if (!sortColumn) return rows

    const directionMultiplier = effectiveSortDirection === 'asc' ? 1 : -1
    const nextRows = [...rows]
    nextRows.sort((leftRow, rightRow) => {
      const leftRawValue = sortColumn.sortAccessor
        ? sortColumn.sortAccessor(leftRow)
        : getValueByKey(leftRow, sortColumn.key)
      const rightRawValue = sortColumn.sortAccessor
        ? sortColumn.sortAccessor(rightRow)
        : getValueByKey(rightRow, sortColumn.key)

      const leftValue = normalizeSortValue(leftRawValue)
      const rightValue = normalizeSortValue(rightRawValue)

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * directionMultiplier
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' }) * directionMultiplier
    })

    return nextRows
  }, [columns, effectiveSortDirection, effectiveSortKey, rows])

  const effectiveTotalRows = totalRows ?? sortedRows.length
  const totalPages = Math.max(1, Math.ceil(effectiveTotalRows / rowsPerPage))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const pageStart = (safePage - 1) * rowsPerPage
  const visibleRows = paginateRows ? sortedRows.slice(pageStart, pageStart + rowsPerPage) : sortedRows

  const onSortColumn = (column: CustomTableColumn) => {
    const columnSortable = column.sortable ?? column.key !== 'action'
    if (!columnSortable) return

    if (effectiveSortKey === column.key) {
      setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(column.key)
    setSortDirection('asc')
  }

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        className="app-scrollbar !mt-4 !overflow-x-auto"
        sx={(theme) => ({
          border: '1px solid',
          borderColor: 'divider',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(17,24,39,0.96) 36%)'
              : 'linear-gradient(180deg, rgba(248,250,252,0.45) 0%, rgba(255,255,255,0.98) 36%)',
        })}
      >
        <Table size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid', borderColor: 'divider' } }}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align}
                  sx={(theme) => ({
                    backgroundColor:
                      theme.palette.mode === 'dark' ? 'rgba(14,165,233,0.18)' : 'rgba(15, 76, 129, 0.08)',
                    color: 'text.primary',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    fontSize: '0.74rem',
                    py: 1.3,
                  })}
                >
                  {(column.sortable ?? column.key !== 'action') ? (
                    <TableSortLabel
                      active={effectiveSortKey === column.key}
                      direction={effectiveSortKey === column.key ? effectiveSortDirection : 'asc'}
                      onClick={() => onSortColumn(column)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 3 }}>
                  <CustomLoader label="Loading data..." center />
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 3, color: 'text.secondary' }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  hover
                  sx={(theme) => ({
                    '&:nth-of-type(odd)': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15, 23, 42, 0.02)',
                    },
                    '& .MuiTableCell-root': { py: 1.4 },
                    transition: 'background-color 120ms ease',
                  })}
                >
                  {renderRow(row)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <CustomPaginationBar
        page={safePage}
        rowsPerPage={rowsPerPage}
        totalRows={effectiveTotalRows}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </>
  )
}

export default CustomTable
