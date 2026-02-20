import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Paper, Typography } from '@mui/material'
import { authService } from '../services/authService'
import CustomInput from '../components/CustomInput'
import CustomLoader from '../components/CustomLoader'
import useToast from '../context/useToast'
import useAuth from '../context/useAuth'
import { roleService } from '../services/roleService'

function LoginPage() {
  const navigate = useNavigate()
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
    <Box className="min-h-screen bg-gradient-to-br from-cyan-700 via-blue-700 to-sky-200 p-4 flex items-center justify-center">
      <Paper elevation={14} className="w-full max-w-md rounded-3xl p-6 sm:p-8 backdrop-blur">
        <Typography variant="h4" className="!font-semibold !text-slate-900">
          Welcome Back
        </Typography>
        <Typography variant="body2" className="!text-slate-600 !mt-2 !mb-6">
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
          <Button type="submit" variant="contained" size="large" disabled={loading} className="!mt-2 !rounded-xl !py-3">
            {loading ? <CustomLoader size={20} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default LoginPage


