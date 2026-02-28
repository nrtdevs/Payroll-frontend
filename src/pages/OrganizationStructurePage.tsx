import { useEffect, useMemo, useState } from 'react'
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import { API_URL } from '../config/env'
import CustomLoader from '../components/CustomLoader'
import useAuth from '../context/useAuth'
import { userService } from '../services/userService'
import type { UserHierarchyNode } from '../services/userService'

const getDocumentEndpoint = (userId: number, documentId: number): string => `${API_URL}/users/${userId}/documents/${documentId}`

function HierarchyAvatar({ node }: { node: UserHierarchyNode }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let active = true

    const loadPreview = async () => {
      if (!node.profile_image_document_id) return
      const token = localStorage.getItem('auth_token')
      if (!token) return
      try {
        const response = await fetch(getDocumentEndpoint(node.id, node.profile_image_document_id), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (active) setPreviewUrl(objectUrl)
      } catch {
        // keep initials fallback
      }
    }

    void loadPreview()
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [node.id, node.profile_image_document_id])

  const initials = (node.name || node.email || `U${node.id}`).trim().charAt(0).toUpperCase()
  return <Avatar src={previewUrl ?? undefined}>{initials}</Avatar>
}

function EmployeeNode({ node, depth = 0 }: { node: UserHierarchyNode; depth?: number }) {
  const theme = useTheme()
  const isRoot = depth === 0
  const borderTone = isRoot ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3)

  return (
    <Box sx={{ pl: depth === 0 ? 0 : 3, position: 'relative' }}>
      {depth > 0 ? (
        <Box
          sx={{
            position: 'absolute',
            left: 11,
            top: -14,
            bottom: 14,
            width: 2.5,
            borderRadius: 99,
            bgcolor: alpha(theme.palette.primary.main, 0.22),
          }}
        />
      ) : null}
      <Card
        variant="outlined"
        sx={{
          mb: 1.8,
          borderRadius: 3.5,
          borderColor: borderTone,
          boxShadow: isRoot
            ? '0 14px 34px rgba(15, 23, 42, 0.2)'
            : '0 8px 22px rgba(15, 23, 42, 0.12)',
          background: isRoot
            ? `linear-gradient(130deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.18)} 100%)`
            : `linear-gradient(130deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.07)} 100%)`,
        }}
      >
        <CardContent sx={{ py: '14px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <HierarchyAvatar node={node} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" className="!font-semibold">
                {node.name || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" className="truncate">
                {node.email || '-'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ ml: { sm: 'auto' } }}>
              <Chip size="small" label={node.role || '-'} color="primary" variant={isRoot ? 'filled' : 'outlined'} />
              <Chip size="small" label={`Team: ${node.children.length}`} icon={<GroupsRoundedIcon />} variant="outlined" />
              <Chip size="small" label={`ID: ${node.id}`} icon={<BadgeRoundedIcon />} variant="outlined" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {node.children.length > 0 ? (
        <Box sx={{ ml: 1 }}>
          {node.children.map((child) => (
            <EmployeeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </Box>
      ) : null}
    </Box>
  )
}

const findNodeById = (nodes: UserHierarchyNode[], userId: number): UserHierarchyNode | null => {
  for (const node of nodes) {
    if (node.id === userId) return node
    const foundInChildren = findNodeById(node.children, userId)
    if (foundInChildren) return foundInChildren
  }
  return null
}

function OrganizationStructurePage() {
  const theme = useTheme()
  const { authState } = useAuth()
  const [hierarchy, setHierarchy] = useState<UserHierarchyNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const currentUserId = authState.user?.id ?? null

  const loadHierarchy = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await userService.getHierarchy()
      setHierarchy(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization structure.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHierarchy()
  }, [])

  const scopedHierarchy = useMemo(() => {
    if (!currentUserId) return hierarchy
    const currentUserNode = findNodeById(hierarchy, currentUserId)
    if (!currentUserNode) return hierarchy
    return [currentUserNode]
  }, [hierarchy, currentUserId])

  const stats = useMemo(() => {
    const countNodes = (nodes: UserHierarchyNode[]): number =>
      nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0)
    const maxDepth = (nodes: UserHierarchyNode[], depth = 1): number =>
      nodes.length === 0 ? depth - 1 : Math.max(...nodes.map((node) => maxDepth(node.children, depth + 1)), depth)
    return {
      totalPeople: countNodes(scopedHierarchy),
      rootLeaders: scopedHierarchy.length,
      levels: maxDepth(scopedHierarchy),
    }
  }, [scopedHierarchy])

  if (loading && hierarchy.length === 0) {
    return <CustomLoader fullscreen label="Loading organization structure..." />
  }

  return (
    <div className="space-y-4">
      <Card
        className="!rounded-2xl"
        sx={{
          background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.14)} 60%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
        }}
      >
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="h5" className="!font-semibold">
                Organization Structure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Employee reporting tree scoped to current logged-in user
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Chip icon={<GroupsRoundedIcon />} label={`People: ${stats.totalPeople}`} color="primary" variant="filled" />
              <Chip icon={<CorporateFareRoundedIcon />} label={`Leaders: ${stats.rootLeaders}`} color="secondary" variant="filled" />
              <Chip icon={<AccountTreeRoundedIcon />} label={`Levels: ${stats.levels}`} variant="outlined" />
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadHierarchy()} disabled={loading}>
                {loading ? <CustomLoader size={16} color="inherit" /> : 'Refresh'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card className="!rounded-2xl">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.4}>
            <Typography variant="h6" className="!font-semibold">
              Employee Tree
            </Typography>
            {currentUserId ? <Chip color="primary" variant="filled" label={`Current User ID: ${currentUserId}`} /> : null}
          </Stack>
          <Divider className="!my-3" />
          {scopedHierarchy.length > 0 ? (
            <Box
              className="space-y-2"
              sx={{
                borderRadius: 3,
                p: { xs: 1.2, md: 1.8 },
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
                background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 100%)`,
              }}
            >
              {scopedHierarchy.map((rootNode) => (
                <EmployeeNode key={rootNode.id} node={rootNode} />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No organization structure data found.
            </Typography>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default OrganizationStructurePage
