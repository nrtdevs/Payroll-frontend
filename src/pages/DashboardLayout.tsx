import { useContext, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import DeviceHubRoundedIcon from '@mui/icons-material/DeviceHubRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { authService } from '../services/authService'
import { ColorModeContext } from '../context/colorMode'
import useToast from '../context/useToast'
import CustomLoader from '../components/CustomLoader'
import useAuth from '../context/useAuth'

const primaryMenuItems = [
  { label: 'Overview', path: '/dashboard', icon: <DashboardRoundedIcon />, permission: null },
  { label: 'Users', path: '/user', icon: <GroupRoundedIcon />, permission: 'LIST_USER' },
  { label: 'Attendance', path: '/attendance', icon: <AccessTimeRoundedIcon />, permission: null },
] as const

const masterMenuChildren = [
  { label: 'Branches', path: '/branch', icon: <AccountTreeRoundedIcon />, permission: 'LIST_BRANCH' },
  { label: 'Roles', path: '/role', icon: <AdminPanelSettingsRoundedIcon />, permission: 'LIST_ROLE' },
  { label: 'Permissions', path: '/permission', icon: <VpnKeyRoundedIcon />, permission: 'LIST_PERMISSION' },
] as const

const settingsMenuChildren = [
  { label: 'Master Setting', path: '/master-setting', icon: <TuneRoundedIcon />, permission: null },
  { label: 'Organization Structure', path: '/organization-structure', icon: <DeviceHubRoundedIcon />, permission: null },
  { label: 'Leave Master', path: '/leave-master', icon: <EventNoteRoundedIcon />, permission: null },
  { label: 'Salary Management', path: '/salary-management', icon: <PaymentsRoundedIcon />, permission: null },
] as const

const expandedWidth = 280
const collapsedWidth = 92

function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const { mode, toggleColorMode } = useContext(ColorModeContext)
  const { showToast } = useToast()
  const { authState, clearAuthData } = useAuth()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  const [desktopPinned, setDesktopPinned] = useState(true)
  const [desktopHovered, setDesktopHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [masterOpen, setMasterOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)

  const userName = useMemo(
    () => authState.user?.name || authState.user?.username || authState.user?.email || localStorage.getItem('auth_user') || 'User',
    [authState.user],
  )
  const permissionSet = useMemo(
    () => new Set((authState.rolePermissions?.permissions ?? []).map((permission) => permission.name)),
    [authState.rolePermissions],
  )
  const visibleMenuItems = useMemo(
    () => primaryMenuItems.filter((item) => item.permission === null || permissionSet.has(item.permission)),
    [permissionSet],
  )
  const visibleMasterChildren = useMemo(
    () => masterMenuChildren.filter((item) => item.permission === null || permissionSet.has(item.permission)),
    [permissionSet],
  )
  const visibleSettingsChildren = useMemo(
    () => settingsMenuChildren.filter((item) => item.permission === null || permissionSet.has(item.permission)),
    [permissionSet],
  )
  const flatVisibleItems = useMemo(
    () => [...visibleMenuItems, ...visibleMasterChildren, ...visibleSettingsChildren],
    [visibleMenuItems, visibleMasterChildren, visibleSettingsChildren],
  )
  const isMasterRouteActive = useMemo(
    () => visibleMasterChildren.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)),
    [location.pathname, visibleMasterChildren],
  )
  const isSettingsRouteActive = useMemo(
    () => visibleSettingsChildren.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)),
    [location.pathname, visibleSettingsChildren],
  )
  const sidebarExpanded = isDesktop ? desktopPinned || desktopHovered : true
  const sidebarWidth = isDesktop ? (sidebarExpanded ? expandedWidth : collapsedWidth) : expandedWidth
  const isDark = mode === 'dark'
  const navTextColor = isDark ? '#e2e8f0' : '#0f172a'
  const navMutedText = isDark ? '#94a3b8' : '#475569'
  const navIconColor = isDark ? '#cbd5e1' : '#334155'
  const navActiveText = theme.palette.primary.main
  const navActiveBg = alpha(theme.palette.primary.main, isDark ? 0.22 : 0.14)
  const navHoverBg = isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.08)'
  const sidebarGradient = isDark
    ? 'linear-gradient(180deg, #0b1622 0%, #0f2135 48%, #0a1522 100%)'
    : 'linear-gradient(180deg, #f8fdff 0%, #edf6ff 55%, #e6f2ff 100%)'

  const pageTitle =
    (location.pathname.startsWith('/role-edit/') || location.pathname.startsWith('/dashboard/role-edit/')
      ? 'Role Permissions'
      : location.pathname === '/profile' || location.pathname === '/dashboard/profile'
        ? 'Profile'
      : undefined) ??
    flatVisibleItems.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))?.label ??
    'Dashboard'

  useEffect(() => {
    setMasterOpen(isMasterRouteActive)
  }, [isMasterRouteActive])

  useEffect(() => {
    setSettingsOpen(isSettingsRouteActive)
  }, [isSettingsRouteActive])

  const onLogout = async () => {
    setLogoutLoading(true)
    try {
      const detail = await authService.logout()
      showToast(detail, 'success')
    } catch {
      showToast('Logout successful.', 'success')
    } finally {
      clearAuthData()
      setLogoutLoading(false)
      navigate('/login', { replace: true })
    }
  }

  const onOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget)
  }

  const onCloseProfileMenu = () => {
    setProfileMenuAnchor(null)
  }

  const sidebarContent = (
    <Box
      className="h-full"
      sx={{ color: navTextColor, background: sidebarGradient }}
      onMouseEnter={() => setDesktopHovered(true)}
      onMouseLeave={() => setDesktopHovered(false)}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} className="px-3 pt-4 pb-3">
        <Avatar sx={{ bgcolor: theme.palette.primary.main, color: isDark ? '#06201e' : '#f8fafc', fontWeight: 800 }}>CL</Avatar>
        {sidebarExpanded ? (
          <Box className="min-w-0 flex-1">
            <Typography variant="subtitle1" className="!font-semibold !leading-tight">
              Company Ltd
            </Typography>
            <Typography variant="caption" sx={{ color: navMutedText }}>
              Admin Console
            </Typography>
          </Box>
        ) : null}
        {sidebarExpanded ? (
          <Tooltip title="Pin sidebar">
            <Switch checked={desktopPinned} onChange={(_, checked) => setDesktopPinned(checked)} size="small" />
          </Tooltip>
        ) : null}
      </Stack>

      <Divider sx={{ borderColor: alpha(navTextColor, 0.2) }} />

      <List className="app-scrollbar px-2 py-3">
        {visibleMenuItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                setMobileOpen(false)
                setMasterOpen(false)
                setSettingsOpen(false)
                if (item.path === '/dashboard' && location.pathname === '/dashboard') {
                  navigate(0)
                  return
                }
                navigate(item.path)
              }}
              className="!mb-1 !rounded-xl"
              sx={{
                bgcolor: active ? navActiveBg : 'transparent',
                '&:hover': { bgcolor: active ? navActiveBg : navHoverBg },
              }}
            >
              <ListItemIcon className="!min-w-10" sx={{ color: active ? navActiveText : navIconColor }}>
                {item.icon}
              </ListItemIcon>
              {sidebarExpanded ? (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? navActiveText : navTextColor }}
                />
              ) : null}
            </ListItemButton>
          )
        })}

        {visibleMasterChildren.length > 0 ? (
          <>
            <ListItemButton
              onClick={() => setMasterOpen((prev) => !prev)}
              className="!mb-1 !rounded-xl"
              sx={{
                bgcolor: isMasterRouteActive ? navActiveBg : 'transparent',
                '&:hover': { bgcolor: isMasterRouteActive ? navActiveBg : navHoverBg },
              }}
            >
              <ListItemIcon className="!min-w-10" sx={{ color: navIconColor }}>
                <AccountTreeRoundedIcon />
              </ListItemIcon>
              {sidebarExpanded ? (
                <>
                  <ListItemText primary="Master" primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: navTextColor }} />
                  {masterOpen ? <ExpandLessRoundedIcon sx={{ color: navIconColor }} /> : <ExpandMoreRoundedIcon sx={{ color: navIconColor }} />}
                </>
              ) : null}
            </ListItemButton>

            <Collapse in={masterOpen && sidebarExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                {visibleMasterChildren.map((item) => {
                  const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  return (
                    <ListItemButton
                      key={item.path}
                      onClick={() => {
                        setMobileOpen(false)
                        navigate(item.path)
                      }}
                      className="!mb-1 !ml-4 !rounded-xl"
                      sx={{
                        bgcolor: active ? navActiveBg : 'transparent',
                        '&:hover': { bgcolor: active ? navActiveBg : navHoverBg },
                      }}
                    >
                      <ListItemIcon className="!min-w-10" sx={{ color: active ? navActiveText : navIconColor }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? navActiveText : navTextColor }}
                      />
                    </ListItemButton>
                  )
                })}
              </List>
            </Collapse>
          </>
        ) : null}

        {visibleSettingsChildren.length > 0 ? (
          <>
            <ListItemButton
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="!mb-1 !rounded-xl"
              sx={{
                bgcolor: isSettingsRouteActive ? navActiveBg : 'transparent',
                '&:hover': { bgcolor: isSettingsRouteActive ? navActiveBg : navHoverBg },
              }}
            >
              <ListItemIcon className="!min-w-10" sx={{ color: navIconColor }}>
                <SettingsRoundedIcon />
              </ListItemIcon>
              {sidebarExpanded ? (
                <>
                  <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: navTextColor }} />
                  {settingsOpen ? <ExpandLessRoundedIcon sx={{ color: navIconColor }} /> : <ExpandMoreRoundedIcon sx={{ color: navIconColor }} />}
                </>
              ) : null}
            </ListItemButton>

            <Collapse in={settingsOpen && sidebarExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                {visibleSettingsChildren.map((item) => {
                  const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  return (
                    <ListItemButton
                      key={item.path}
                      onClick={() => {
                        setMobileOpen(false)
                        navigate(item.path)
                      }}
                      className="!mb-1 !ml-4 !rounded-xl"
                      sx={{
                        bgcolor: active ? navActiveBg : 'transparent',
                        '&:hover': { bgcolor: active ? navActiveBg : navHoverBg },
                      }}
                    >
                      <ListItemIcon className="!min-w-10" sx={{ color: active ? navActiveText : navIconColor }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? navActiveText : navTextColor }}
                      />
                    </ListItemButton>
                  )
                })}
              </List>
            </Collapse>
          </>
        ) : null}
      </List>
    </Box>
  )

  return (
    <Box className="h-screen flex" sx={{ bgcolor: 'background.default' }}>
      {isDesktop ? (
        <Box sx={{ width: sidebarWidth, transition: 'width .2s ease' }} className="shrink-0">
          <Box
            sx={{
              width: sidebarWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: 8,
            }}
            className="h-full"
          >
            {sidebarContent}
          </Box>
        </Box>
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: expandedWidth } }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Box className="flex-1 min-w-0 flex flex-col">
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          className="backdrop-blur"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.88),
          }}
        >
          <Toolbar className="!min-h-16 !px-3 sm:!px-5">
            {!isDesktop ? (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} className="!mr-2">
                <MenuRoundedIcon />
              </IconButton>
            ) : null}
            <Typography variant="h6" className="!font-semibold">
              {pageTitle}
            </Typography>
            <Box className="ml-auto flex items-center gap-2">
              <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                <IconButton color="primary" onClick={toggleColorMode} aria-label="toggle color mode">
                  {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Profile">
                <IconButton color="primary" onClick={onOpenProfileMenu}>
                  <Avatar
                    className="!h-8 !w-8 !text-sm !font-semibold"
                    sx={{ bgcolor: theme.palette.primary.main, color: isDark ? '#06201e' : '#f8fafc' }}
                  >
                    {(userName || 'U').trim().charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <Box className="app-scrollbar flex-1 overflow-auto p-3 sm:p-5">
          <Outlet key={`${location.pathname}${location.search}`} />
        </Box>
      </Box>

      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={onCloseProfileMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            onCloseProfileMenu()
            navigate('/profile')
          }}
        >
          <ListItemIcon>
            <PersonRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={userName} secondary={authState.user?.email || 'Profile'} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            onCloseProfileMenu()
            void onLogout()
          }}
          disabled={logoutLoading}
        >
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={logoutLoading ? 'Logging out...' : 'Logout'} />
          {logoutLoading ? <CustomLoader size={14} /> : null}
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default DashboardLayout
