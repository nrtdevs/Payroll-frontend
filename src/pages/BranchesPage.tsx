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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { branchService } from '../services/branchService'
import type { Branch, BranchPayload } from '../services/branchService'
import CustomInput from '../components/CustomInput'

const emptyBranchForm: BranchPayload = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: '',
}

function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchError, setBranchError] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [branchForm, setBranchForm] = useState<BranchPayload>(emptyBranchForm)
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null)
  const [submittingBranch, setSubmittingBranch] = useState(false)

  const loadBranches = async () => {
    setLoadingBranches(true)
    setBranchError('')
    try {
      const data = await branchService.getBranches()
      setBranches(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load branches.'
      setBranchError(message)
    } finally {
      setLoadingBranches(false)
    }
  }

  useEffect(() => {
    void loadBranches()
  }, [])

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
      await loadBranches()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create branch.'
      setBranchError(message)
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
      await loadBranches()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update branch.'
      setBranchError(message)
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete branch.'
      setBranchError(message)
    }
  }

  const onViewBranch = async (id: number) => {
    setBranchError('')
    try {
      const branch = await branchService.getBranchById(id)
      setSelectedBranch(branch)
      setViewOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch branch.'
      setBranchError(message)
    }
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
                Refresh
              </Button>
            </Stack>
          </Stack>

          {branchError ? (
            <Alert severity="error" className="!mt-3">
              {branchError}
            </Alert>
          ) : null}

          <TableContainer className="app-scrollbar !mt-4 !overflow-x-auto">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.length === 0 && !loadingBranches ? (
                  <TableRow>
                    <TableCell colSpan={7}>No branches found.</TableCell>
                  </TableRow>
                ) : null}
                {branches.map((branch) => (
                  <TableRow key={branch.id} hover>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
                {submittingBranch ? 'Saving...' : 'Create'}
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
                {submittingBranch ? 'Saving...' : 'Update'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Branch Detail</DialogTitle>
        <DialogContent>
          <pre className="m-0 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
            {JSON.stringify(selectedBranch, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BranchesPage
