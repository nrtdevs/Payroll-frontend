import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TableCell,
  Tooltip,
  Typography,
} from '@mui/material'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { branchService } from '../services/branchService'
import type { Branch, BranchListFilters, BranchPayload } from '../services/branchService'
import CustomInput from '../components/CustomInput'
import CustomTable, { type CustomTableColumn } from '../components/CustomTable'
import CustomLoader from '../components/CustomLoader'
import useToast from '../context/useToast'

const emptyBranchForm: BranchPayload = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: '',
}

function BranchesPage() {
  const { showToast } = useToast()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchError, setBranchError] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [loadingBranchDetail, setLoadingBranchDetail] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [branchForm, setBranchForm] = useState<BranchPayload>(emptyBranchForm)
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null)
  const [submittingBranch, setSubmittingBranch] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalBranches, setTotalBranches] = useState(0)
  const [filterDraft, setFilterDraft] = useState<BranchListFilters>({ name: '', city: '', state: '', country: '' })
  const [filters, setFilters] = useState<BranchListFilters>({ name: '', city: '', state: '', country: '' })

  const branchColumns: CustomTableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'action', label: 'Action', align: 'right' },
  ]

  const loadBranches = async () => {
    setLoadingBranches(true)
    setBranchError('')
    try {
      const data = await branchService.getBranchesPaginated(page, rowsPerPage, filters)
      setBranches(data.items)
      setTotalBranches(data.total)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load branches.'
      setBranchError(message)
    } finally {
      setLoadingBranches(false)
    }
  }

  useEffect(() => {
    void loadBranches()
  }, [page, rowsPerPage, filters])

  const closeCreateModal = () => {
    setCreateOpen(false)
    setBranchForm(emptyBranchForm)
  }

  const closeEditModal = () => {
    setEditOpen(false)
    setEditingBranchId(null)
    setBranchForm(emptyBranchForm)
  }

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittingBranch(true)
    setBranchError('')
    try {
      await branchService.createBranch(branchForm)
      closeCreateModal()
      showToast('Branch created successfully.', 'success')
      await loadBranches()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create branch.'
      setBranchError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingBranch(false)
    }
  }

  const onEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingBranchId === null) return
    setSubmittingBranch(true)
    setBranchError('')
    try {
      await branchService.updateBranch(editingBranchId, branchForm)
      closeEditModal()
      showToast('Branch updated successfully.', 'success')
      await loadBranches()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update branch.'
      setBranchError(message)
      showToast(message, 'error')
    } finally {
      setSubmittingBranch(false)
    }
  }

  const onEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id)
    setBranchForm({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      country: branch.country,
    })
    setEditOpen(true)
  }

  const onDeleteBranch = async (branch: Branch) => {
    const approved = window.confirm(`Delete branch "${branch.name}"?`)
    if (!approved) return
    setBranchError('')
    try {
      await branchService.deleteBranch(branch.id)
      if (selectedBranch?.id === branch.id) {
        setSelectedBranch(null)
      }
      await loadBranches()
      showToast('Branch deleted successfully.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete branch.'
      setBranchError(message)
      showToast(message, 'error')
    }
  }

  const onViewBranch = async (id: number) => {
    setBranchError('')
    setViewOpen(true)
    setLoadingBranchDetail(true)
    setSelectedBranch(null)
    try {
      const branch = await branchService.getBranchById(id)
      setSelectedBranch(branch)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch branch.'
      setBranchError(message)
    } finally {
      setLoadingBranchDetail(false)
    }
  }

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setFilters({
      name: filterDraft.name?.trim() ?? '',
      city: filterDraft.city?.trim() ?? '',
      state: filterDraft.state?.trim() ?? '',
      country: filterDraft.country?.trim() ?? '',
    })
  }

  const onResetFilters = () => {
    const emptyFilters: BranchListFilters = { name: '', city: '', state: '', country: '' }
    setFilterDraft(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
  }

  if (loadingBranches && branches.length === 0) {
    return <CustomLoader fullscreen label="Loading branches..." />
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h5" className="!font-semibold">
              Branch List
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
                Create Branch
              </Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadBranches()} disabled={loadingBranches}>
                {loadingBranches ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <Box component="form" onSubmit={onFilterSubmit} className="!mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <CustomInput
              label="Filter Name"
              value={filterDraft.name ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="central"
            />
            <CustomInput
              label="Filter City"
              value={filterDraft.city ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="delhi"
            />
            <CustomInput
              label="Filter State"
              value={filterDraft.state ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, state: event.target.value }))}
              placeholder="delhi"
            />
            <CustomInput
              label="Filter Country"
              value={filterDraft.country ?? ''}
              onChange={(event) => setFilterDraft((prev) => ({ ...prev, country: event.target.value }))}
              placeholder="india"
            />
            <Stack direction="row" spacing={1} alignItems="end">
              <Button type="submit" variant="contained" className="!h-[44px]">
                Apply
              </Button>
              <Button type="button" variant="outlined" onClick={onResetFilters} className="!h-[44px]">
                Reset
              </Button>
            </Stack>
          </Box>

          {branchError ? (
            <Alert severity="error" className="!mt-3">
              {branchError}
            </Alert>
          ) : null}

          <CustomTable
            columns={branchColumns}
            rows={branches}
            rowKey={(branch) => branch.id}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
            emptyMessage="No branches found."
            loading={loadingBranches}
            totalRows={totalBranches}
            paginateRows={false}
            renderRow={(branch) => (
              <>
                <TableCell>{branch.id}</TableCell>
                <TableCell>{branch.name}</TableCell>
                <TableCell>{branch.address}</TableCell>
                <TableCell>{branch.city}</TableCell>
                <TableCell>{branch.state}</TableCell>
                <TableCell>{branch.country}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton onClick={() => void onViewBranch(branch.id)}>
                      <VisibilityRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEditBranch(branch)}>
                      <EditRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => void onDeleteBranch(branch)}>
                      <DeleteRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onClose={closeCreateModal} fullWidth maxWidth="sm">
        <DialogTitle>Create Branch</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onCreateSubmit} className="grid gap-3 pt-1">
            <CustomInput label="Name" value={branchForm.name} onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))} required />
            <CustomInput
              label="Address"
              value={branchForm.address}
              onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
              required
            />
            <CustomInput label="City" value={branchForm.city} onChange={(e) => setBranchForm((p) => ({ ...p, city: e.target.value }))} required />
            <CustomInput label="State" value={branchForm.state} onChange={(e) => setBranchForm((p) => ({ ...p, state: e.target.value }))} required />
            <CustomInput
              label="Country"
              value={branchForm.country}
              onChange={(e) => setBranchForm((p) => ({ ...p, country: e.target.value }))}
              required
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeCreateModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingBranch}>
                {submittingBranch ? <CustomLoader size={18} color="inherit" /> : 'Create'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle>Update Branch #{editingBranchId}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={onEditSubmit} className="grid gap-3 pt-1">
            <CustomInput label="Name" value={branchForm.name} onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))} required />
            <CustomInput
              label="Address"
              value={branchForm.address}
              onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
              required
            />
            <CustomInput label="City" value={branchForm.city} onChange={(e) => setBranchForm((p) => ({ ...p, city: e.target.value }))} required />
            <CustomInput label="State" value={branchForm.state} onChange={(e) => setBranchForm((p) => ({ ...p, state: e.target.value }))} required />
            <CustomInput
              label="Country"
              value={branchForm.country}
              onChange={(e) => setBranchForm((p) => ({ ...p, country: e.target.value }))}
              required
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={closeEditModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submittingBranch}>
                {submittingBranch ? <CustomLoader size={18} color="inherit" /> : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Branch Detail</DialogTitle>
        <DialogContent>
          {loadingBranchDetail ? (
            <CustomLoader label="Loading branch detail..." />
          ) : (
            <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
              {JSON.stringify(selectedBranch, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BranchesPage
