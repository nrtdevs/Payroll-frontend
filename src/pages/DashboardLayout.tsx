import { useContext, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
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
  Button,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { authService } from '../services/authService'
import { ColorModeContext } from '../context/colorMode'
import useToast from '../context/useToast'
import CustomLoader from '../components/CustomLoader'

const menuItems = [
  { label: 'Overview', path: '/dashboard', icon: <DashboardRoundedIcon /> },
  { label: 'Branches', path: '/branch', icon: <AccountTreeRoundedIcon /> },
  { label: 'Roles', path: '/role', icon: <AdminPanelSettingsRoundedIcon /> },
  { label: 'Users', path: '/user', icon: <GroupRoundedIcon /> },
  { label: 'Permissions', path: '/permission', icon: <VpnKeyRoundedIcon /> },
] as const

const expandedWidth = 280
const collapsedWidth = 92

function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const { mode, toggleColorMode } = useContext(ColorModeContext)
  const { showToast } = useToast()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  const [desktopPinned, setDesktopPinned] = useState(true)
  const [desktopHovered, setDesktopHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const userName = useMemo(() => localStorage.getItem('auth_user') || 'User', [])
  const sidebarExpanded = isDesktop ? desktopPinned || desktopHovered : true
  const sidebarWidth = isDesktop ? (sidebarExpanded ? expandedWidth : collapsedWidth) : expandedWidth

  const pageTitle =
    (location.pathname.startsWith('/role-edit/') || location.pathname.startsWith('/dashboard/role-edit/')
      ? 'Role Permissions'
      : undefined) ??
    menuItems.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))?.label ??
    'Dashboard'

  const onLogout = async () => {
    setLogoutLoading(true)
    try {
      const detail = await authService.logout()
      showToast(detail, 'success')
    } catch {
      showToast('Logout successful.', 'success')
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setLogoutLoading(false)
      navigate('/login', { replace: true })
    }
  }

  const sidebarContent = (
    <Box
      className="h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100"
      onMouseEnter={() => setDesktopHovered(true)}
      onMouseLeave={() => setDesktopHovered(false)}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} className="px-3 pt-4 pb-3">
        <Avatar className="!bg-cyan-500 !text-slate-900 !font-bold">CL</Avatar>
        {sidebarExpanded ? (
          <Box className="min-w-0 flex-1">
            <Typography variant="subtitle1" className="!font-semibold !leading-tight">
              Company Ltd
            </Typography>
            <Typography variant="caption" className="!text-slate-400">
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

      <Divider className="!border-slate-700" />

      <List className="app-scrollbar px-2 py-3">
        {menuItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`!mb-1 !rounded-xl ${active ? '!bg-cyan-500/15' : '!bg-transparent hover:!bg-slate-700/70'}`}
            >
              <ListItemIcon className={`!min-w-10 ${active ? '!text-cyan-300' : '!text-slate-300'}`}>{item.icon}</ListItemIcon>
              {sidebarExpanded ? (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#67e8f9' : '#e2e8f0' }}
                />
              ) : null}
            </ListItemButton>
          )
        })}
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
            bgcolor: mode === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
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
              <Typography variant="body2" className="!hidden sm:!block" color="text.secondary">
                {userName}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<LogoutRoundedIcon />}
                disabled={logoutLoading}
                onClick={() => void onLogout()}
                className="!rounded-lg"
              >
                {logoutLoading ? <CustomLoader size={16} color="inherit" /> : 'Logout'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box className="app-scrollbar flex-1 overflow-auto p-3 sm:p-5">
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardLayout
