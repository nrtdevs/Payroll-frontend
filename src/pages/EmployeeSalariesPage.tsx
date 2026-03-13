import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardContent, MenuItem, Stack, TableCell, Typography } from '@mui/material'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import useToast from '../context/useToast'
import { salaryService } from '../services/salaryService'
import { userService, type User } from '../services/userService'
import type { EmployeeSalary, EmployeeSalaryPayload, SalaryComponent, SalaryStructure } from '../types/salaryTypes'
import { useNavigate } from 'react-router-dom'

type AssignmentRow = {
  component_id: number
  component_name: string
  component_type: 'EARNING' | 'DEDUCTION'
  amount: string
}

const currentDate = new Date().toISOString().slice(0, 10)

const emptyForm: EmployeeSalaryPayload = {
  employee_id: 0,
  salary_structure_id: 0,
  effective_from: currentDate,
  components: [],
}

function EmployeeSalariesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [rows, setRows] = useState<EmployeeSalary[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [components, setComponents] = useState<SalaryComponent[]>([])

  const [loading, setLoading] = useState(false)
  const [loadingStructure, setLoadingStructure] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedStructureComponentIds, setSelectedStructureComponentIds] = useState<number[]>([])
  const [selectedStructureActive, setSelectedStructureActive] = useState<boolean>(true)

  const [form, setForm] = useState<EmployeeSalaryPayload>(emptyForm)
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([])
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const columns: CustomTableColumn[] = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'employee', label: 'Employee' },
      { key: 'structure', label: 'Structure' },
      { key: 'effective_from', label: 'Effective From' },
      { key: 'gross_salary', label: 'Gross Salary' },
      { key: 'total_deductions', label: 'Total Deductions' },
      { key: 'net_salary', label: 'Net Salary' },
      { key: 'action', label: 'Action', align: 'right', sortable: false },
    ],
    [],
  )

  const componentMap = useMemo(() => new Map(components.map((component) => [component.id, component])), [components])

  const resolveEmployeeName = (employeeId: number): string => {
    const employee = users.find((item) => item.id === employeeId)
    if (!employee) return `Employee #${employeeId}`
    return employee.name || employee.email || `Employee #${employeeId}`
  }

  const resolveStructureName = (structureId: number): string => {
    const structure = structures.find((item) => item.id === structureId)
    return structure?.name || `Structure #${structureId}`
  }

  const buildRowsFromStructureDetails = (structure: SalaryStructure, amountMap: Map<number, string>) =>
    structure.components.map((item) => {
      const component = componentMap.get(item.component_id)
      return {
        component_id: item.component_id,
        component_name: item.component_name ?? component?.name ?? `Component #${item.component_id}`,
        component_type: item.component_type ?? component?.type ?? 'EARNING',
        amount: amountMap.get(item.component_id) ?? '',
      }
    })

  const loadData = async () => {
    setLoading(true)
    setError('')
    const [salaryResult, usersResult, structuresResult, componentsResult] = await Promise.allSettled([
      salaryService.getEmployeeSalaries(),
      userService.getUsers(),
      salaryService.getSalaryStructures(),
      salaryService.getSalaryComponents(),
    ])

    const errors: string[] = []

    if (salaryResult.status === 'fulfilled') {
      setRows(salaryResult.value.items)
    } else {
      errors.push(salaryResult.reason instanceof Error ? salaryResult.reason.message : 'Failed to load salary records.')
      setRows([])
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value)
    } else {
      errors.push(usersResult.reason instanceof Error ? usersResult.reason.message : 'Failed to load employees.')
      setUsers([])
    }

    if (structuresResult.status === 'fulfilled') {
      setStructures(structuresResult.value.items)
    } else {
      errors.push(structuresResult.reason instanceof Error ? structuresResult.reason.message : 'Failed to load salary structures.')
      setStructures([])
    }

    if (componentsResult.status === 'fulfilled') {
      setComponents(componentsResult.value.items)
    } else {
      errors.push(componentsResult.reason instanceof Error ? componentsResult.reason.message : 'Failed to load salary components.')
      setComponents([])
    }

    if (errors.length > 0) {
      setError(errors[0])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const onSelectStructure = async (structureId: number) => {
    setForm((prev) => ({ ...prev, salary_structure_id: structureId, components: [] }))

    if (!structureId) {
      setAssignmentRows([])
      setSelectedStructureComponentIds([])
      setSelectedStructureActive(true)
      return
    }

    setLoadingStructure(true)
    setError('')
    try {
      const details = await salaryService.getSalaryStructureById(structureId)
      const amountMap = new Map(assignmentRows.map((row) => [row.component_id, row.amount]))
      setSelectedStructureComponentIds(details.components.map((item) => item.component_id))
      setSelectedStructureActive(details.is_active !== false)
      setAssignmentRows(buildRowsFromStructureDetails(details, amountMap))
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load structure components.'
      setError(message)
      setAssignmentRows([])
      setSelectedStructureComponentIds([])
      setSelectedStructureActive(true)
    } finally {
      setLoadingStructure(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setAssignmentRows([])
    setSelectedStructureComponentIds([])
    setSelectedStructureActive(true)
    setError('')
  }

  const onEdit = (row: EmployeeSalary) => {
    setEditingId(row.id)

    const amountMap = new Map(
      (row.components ?? [])
        .filter((item) => Number.isFinite(item.amount))
        .map((item) => [item.component_id, String(item.amount)]),
    )

    setForm({
      employee_id: row.employee_id,
      salary_structure_id: row.salary_structure_id,
      effective_from: row.effective_from || currentDate,
      components: [],
    })
    void onSelectStructure(row.salary_structure_id).then(() => {
      setAssignmentRows((prevRows) =>
        prevRows.map((item) => ({
          ...item,
          amount: amountMap.get(item.component_id) ?? '',
        })),
      )
    })
  }

  const onChangeAmount = (componentId: number, amount: string) => {
    setAssignmentRows((prevRows) => prevRows.map((row) => (row.component_id === componentId ? { ...row, amount } : row)))
  }

  const validateForm = (): string | null => {
    if (!form.employee_id) return 'Employee is required.'
    if (!form.salary_structure_id) return 'Salary structure is required.'
    if (!selectedStructureActive) return 'Selected salary structure is inactive.'
    if (!form.effective_from) return 'Effective from date is required.'
    if (assignmentRows.length === 0) return 'Selected structure has no components.'

    for (const row of assignmentRows) {
      if (!selectedStructureComponentIds.includes(row.component_id)) {
        return `${row.component_name} is not allowed for the selected structure.`
      }
      if (!componentMap.has(row.component_id)) {
        return `${row.component_name} (ID: ${row.component_id}) does not exist in salary components.`
      }
      if (row.amount.trim() === '') return `Amount is required for ${row.component_name}.`
      const parsedAmount = Number(row.amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return `Invalid amount for ${row.component_name}.`
    }

    return null
  }

  const onSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')

    const basePayload = {
      effective_from: form.effective_from,
      components: assignmentRows.map((row) => ({
        component_id: row.component_id,
        amount: Number(row.amount),
      })),
    }

    try {
      if (editingId === null) {
        await salaryService.createEmployeeSalary({
          employee_id: form.employee_id,
          salary_structure_id: form.salary_structure_id,
          ...basePayload,
        })
        showToast('Employee salary assigned successfully.', 'success')
      } else {
        await salaryService.updateEmployeeSalary(editingId, basePayload)
        showToast('Employee salary revised successfully.', 'success')
      }
      resetForm()
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to save employee salary.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onLoadEmployeeHistory = async () => {
    if (!form.employee_id) {
      setError('Select an employee first to load salary history.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const records = await salaryService.getEmployeeSalaryByEmployeeId(form.employee_id)
      setRows(records)
      setPage(1)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load employee salary history.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && rows.length === 0) {
    return <CustomLoader fullscreen label="Loading employee salary assignments..." />
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Typography variant="h5" className="!font-semibold">
            Employee Salary Assignment
          </Typography>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <CustomInput
              label="Employee"
              select
              value={form.employee_id || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, employee_id: Number(event.target.value) }))}
              required
              disabled={submitting || loadingStructure || editingId !== null}
            >
              <MenuItem value="" disabled>
                Select employee
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name || user.email || `Employee #${user.id}`}
                </MenuItem>
              ))}
            </CustomInput>

            <CustomInput
              label="Salary Structure"
              select
              value={form.salary_structure_id || ''}
              onChange={(event) => void onSelectStructure(Number(event.target.value))}
              required
              disabled={submitting || loadingStructure || editingId !== null}
            >
              <MenuItem value="" disabled>
                Select structure
              </MenuItem>
              {structures.map((structure) => (
                <MenuItem key={structure.id} value={structure.id}>
                  {structure.name}
                </MenuItem>
              ))}
            </CustomInput>

            <CustomInput
              label="Effective From"
              type="date"
              value={form.effective_from || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, effective_from: event.target.value }))}
              required
              disabled={submitting || loadingStructure}
              InputLabelProps={{ shrink: true }}
            />

            <Stack direction="row" spacing={1} alignItems="end">
              <Button variant="contained" className="!h-[44px]" onClick={() => void onSubmit()} disabled={submitting || loadingStructure}>
                {submitting ? <CustomLoader size={18} color="inherit" /> : editingId === null ? 'Assign Salary' : 'Update Revision'}
              </Button>
              <Button variant="outlined" className="!h-[44px]" onClick={resetForm} disabled={submitting || loadingStructure}>
                {editingId === null ? 'Reset' : 'Cancel Edit'}
              </Button>
            </Stack>
          </div>

          {loadingStructure ? (
            <Typography variant="body2" color="text.secondary" className="!mt-2">
              Loading structure components...
            </Typography>
          ) : null}

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60">
                  <th className="px-3 py-2 text-left">Component Name</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {assignmentRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-slate-500">
                      Select a salary structure to load components.
                    </td>
                  </tr>
                ) : (
                  assignmentRows.map((row) => (
                    <tr key={row.component_id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="px-3 py-2">{row.component_name}</td>
                      <td className="px-3 py-2">{row.component_type}</td>
                      <td className="px-3 py-2">
                        <CustomInput
                          type="number"
                          value={row.amount}
                          onChange={(event) => onChangeAmount(row.component_id, event.target.value)}
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                          disabled={submitting}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} className="!mt-3">
            <Button variant="outlined" onClick={() => void onLoadEmployeeHistory()} disabled={loading || submitting}>
              Load Selected Employee Salaries
            </Button>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadData()} disabled={loading || submitting}>
              {loading ? <CustomLoader size={16} color="inherit" /> : 'Show All'}
            </Button>
          </Stack>

          {error ? (
            <Alert severity="error" className="!mt-3">
              {error}
            </Alert>
          ) : null}

          <CustomTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(size) => {
              setRowsPerPage(size)
              setPage(1)
            }}
            emptyMessage="No employee salary records found."
            loading={loading}
            renderRow={(row) => (
              <>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.employee_name || resolveEmployeeName(row.employee_id)}</TableCell>
                <TableCell>{row.salary_structure_name || resolveStructureName(row.salary_structure_id)}</TableCell>
                <TableCell>{row.effective_from || '-'}</TableCell>
                <TableCell>{row.gross_salary?.toFixed(2) ?? '-'}</TableCell>
                <TableCell>{row.total_deductions?.toFixed(2) ?? '-'}</TableCell>
                <TableCell>{row.net_salary?.toFixed(2) ?? '-'}</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => onEdit(row)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<VisibilityRoundedIcon />}
                    onClick={() => navigate(`/admin/employee-salaries/${row.employee_id}`)}
                  >
                    Breakdown
                  </Button>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeSalariesPage
