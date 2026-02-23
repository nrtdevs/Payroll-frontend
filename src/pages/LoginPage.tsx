import { useContext, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { authService } from '../services/authService'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import useToast from '../context/useToast'
import useAuth from '../context/useAuth'
import { roleService } from '../services/roleService'
import { ColorModeContext } from '../context/colorMode'

function LoginPage() {
  const navigate = useNavigate()
  const { mode, toggleColorMode } = useContext(ColorModeContext)
  const { showToast } = useToast()
  const { setAuthData } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const message = sessionStorage.getItem('auth_toast_message')
    if (!message) return
    showToast(message, 'success')
    sessionStorage.removeItem('auth_toast_message')
  }, [showToast])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await authService.login({ username, password })
      let rolePermissions = null
      const roleId = result.user?.role_id
      if (typeof roleId === 'number' && Number.isFinite(roleId)) {
        localStorage.setItem('auth_token', result.token)
        rolePermissions = await roleService.getRolePermissionsData(roleId)
      }
      setAuthData(result.token, result.user, rolePermissions)
      showToast('Login successful.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      className="min-h-screen p-4 flex items-center justify-center"
      sx={{
        position: 'relative',
        background:
          mode === 'dark'
            ? 'linear-gradient(145deg, #04111f 0%, #0b2740 54%, #144d5f 100%)'
            : 'linear-gradient(145deg, #dff7f4 0%, #e5f0ff 52%, #cde2ff 100%)',
      }}
    >
      <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
        <IconButton
          color="primary"
          onClick={toggleColorMode}
          sx={{ position: 'absolute', top: 20, right: 20, bgcolor: 'background.paper' }}
          aria-label="toggle color mode"
        >
          {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
        </IconButton>
      </Tooltip>

      <Paper
        elevation={16}
        className="w-full max-w-md rounded-3xl p-6 sm:p-8 backdrop-blur"
        sx={{
          backgroundColor: mode === 'dark' ? 'rgba(11, 26, 42, 0.92)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: mode === 'dark' ? 'rgba(148, 163, 184, 0.22)' : 'rgba(15, 23, 42, 0.08)',
        }}
      >
        <Typography variant="h4" className="!font-semibold">
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" className="!mt-2 !mb-6">
          Sign in to your account and continue.
        </Typography>

        {error ? (
          <Alert severity="error" className="!mb-4">
            {error}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={onSubmit} className="grid gap-4">
          <CustomInput
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            requiredMessage="Username is required."
            fullWidth
          />
          <CustomInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            requiredMessage="Password is required."
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            className="!mt-2 !rounded-xl !py-3"
            sx={{ boxShadow: mode === 'dark' ? '0 10px 28px rgba(45, 212, 191, 0.35)' : '0 10px 24px rgba(15, 118, 110, 0.25)' }}
          >
            {loading ? <CustomLoader size={20} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default LoginPage


