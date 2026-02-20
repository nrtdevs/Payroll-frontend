import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { permissionService } from '../services/permissionService'
import type { Permission } from '../services/permissionService'
import { roleService } from '../services/roleService'
import useToast from '../context/useToast'
import CustomLoader from '../components/CustomLoader'

const prettifyToken = (value: string): string => {
  return value
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function RoleEditPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { roleId } = useParams<{ roleId: string }>()
  const numericRoleId = Number(roleId)
  const initialRoleName = (location.state as { roleName?: string } | null)?.roleName

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [error, setError] = useState('')
  const [roleName, setRoleName] = useState(initialRoleName ?? '')

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
      const groupName = permission.group || 'UNGROUPED'
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(permission)
      return acc
    }, {})
  }, [permissions])
  const totalGroups = Object.keys(groupedPermissions).length

  useEffect(() => {
    const loadPermissions = async () => {
      if (!Number.isFinite(numericRoleId) || numericRoleId <= 0) {
        setError('Invalid role id.')
        return
      }

      setLoadingPermissions(true)
      setError('')
      try {
        const [permissionData, rolePermissionIds, roleData] = await Promise.all([
          permissionService.getPermissions(),
          roleService.getRolePermissions(numericRoleId),
          roleName ? Promise.resolve(null) : roleService.getRoleById(numericRoleId),
        ])
        setPermissions(permissionData)
        setSelectedPermissionIds(rolePermissionIds)
        if (roleData?.name) {
          setRoleName(roleData.name)
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load permissions.'
        setError(message)
      } finally {
        setLoadingPermissions(false)
      }
    }

    void loadPermissions()
  }, [numericRoleId, roleName])

  const onTogglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    )
  }

  const onSubmitPermissions = async () => {
    if (!Number.isFinite(numericRoleId) || numericRoleId <= 0) return
    setSavingPermissions(true)
    setError('')
    try {
      await roleService.updateRolePermissions(numericRoleId, {
        permissionIds: selectedPermissionIds,
      })
      showToast('Permissions assigned successfully.', 'success')
      navigate('/role', { replace: true })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to update permissions.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSavingPermissions(false)
    }
  }

  if (loadingPermissions && permissions.length === 0) {
    return <CustomLoader fullscreen label="Loading role permissions..." />
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden !rounded-2xl">
        <div className="bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-600 px-5 py-5 text-white sm:px-6">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <div>
              <Typography variant="overline" className="!tracking-[0.14em] !text-cyan-100">
                Role Permissions
              </Typography>
              <Typography variant="h5" className="!font-semibold">
                {roleName || `Role #${roleId}`}
              </Typography>
              <Typography variant="body2" className="!mt-1 !text-cyan-100">
                Assign permissions grouped by domain.
              </Typography>
            </div>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`${permissions.length} Permissions`} className="!bg-white/20 !text-white" />
              <Chip label={`${totalGroups} Groups`} className="!bg-white/20 !text-white" />
            </Stack>
          </Stack>
        </div>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Typography variant="h6" className="!font-semibold">
              Permission Matrix
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/role')}>
                Back to Roles
              </Button>
            </Stack>
          </Stack>

          {error ? (
            <Alert severity="error" className="!mt-3">
              {error}
            </Alert>
          ) : null}

          <Box className="!mt-4 space-y-4">
            {loadingPermissions ? (
              <CustomLoader label="Loading permissions..." />
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <Typography variant="body2" className="!text-slate-600">
                No permissions found.
              </Typography>
            ) : (
              Object.entries(groupedPermissions)
                .sort(([leftGroup], [rightGroup]) => leftGroup.localeCompare(rightGroup))
                .map(([groupName, groupPermissions], index) => (
                  <div
                    key={groupName}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 shadow-sm"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: ['#0284c7', '#16a34a', '#9333ea', '#ea580c'][index % 4],
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" className="!mb-2">
                      <Typography variant="subtitle2" className="!font-semibold !text-slate-800">
                        {prettifyToken(groupName)}
                      </Typography>
                      <Chip size="small" label={`${groupPermissions.length} items`} />
                    </Stack>
                    <FormGroup>
                      {groupPermissions
                        .slice()
                        .sort((leftPermission, rightPermission) =>
                          leftPermission.permission_name.localeCompare(rightPermission.permission_name),
                        )
                        .map((permission) => (
                          <FormControlLabel
                            key={permission.id}
                            control={
                              <Checkbox
                                checked={selectedPermissionIds.includes(permission.id)}
                                onChange={() => onTogglePermission(permission.id)}
                              />
                            }
                              label={
                                <span>
                                  {prettifyToken(permission.permission_name)}
                                  {permission.description ? (
                                    <span className="ml-2 text-xs text-slate-500">({permission.description})</span>
                                  ) : null}
                                </span>
                              }
                          />
                        ))}
                    </FormGroup>
                  </div>
                ))
            )}
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={1} className="!mt-4">
            <Button variant="outlined" onClick={() => navigate('/role')}>
              Cancel
            </Button>
            <Button variant="contained" onClick={() => void onSubmitPermissions()} disabled={loadingPermissions || savingPermissions}>
              {savingPermissions ? <CustomLoader size={18} color="inherit" /> : 'Submit'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </div>
  )
}

export default RoleEditPage
