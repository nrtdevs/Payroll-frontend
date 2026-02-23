import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha, keyframes } from '@mui/material/styles'
import { useContext } from 'react'
import { ColorModeContext } from '../context/colorMode'

type CustomLoaderProps = {
  size?: number | string
  label?: string
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | string
  fullscreen?: boolean
  center?: boolean
}

const bounceDot = keyframes`
  0%,2% { bottom: 0%; }
  98%,100% { bottom: 0.1%; }
`

const rotateFrame = keyframes`
  0%,30% { rotate: 0deg; }
  70%,100% { rotate: 90deg; }
`

function CustomLoader({ size = 60, label, color = '#524656', fullscreen = false, center = false }: CustomLoaderProps) {
  const indicatorSize = typeof size === 'number' ? size : 60
  const { mode } = useContext(ColorModeContext)
  const isDark = mode === 'dark'
  const dotColor = isDark ? '#67e8f9' : '#0f766e'
  const ringColor = color === '#524656' ? (isDark ? '#93c5fd' : '#0f4c81') : color

  const loaderContent = (
    <Stack direction="column" alignItems="center" spacing={1.2}>
      <Box
        sx={{
          height: indicatorSize,
          aspectRatio: '1 / 1',
          position: 'relative',
          border: '3px solid transparent',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 'auto 35% 0',
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            background: dotColor,
            animation: `${bounceDot} .5s cubic-bezier(0,800,1,800) infinite`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            outline: `3px solid ${ringColor}`,
            animation: `${rotateFrame} .5s linear infinite`,
          },
        }}
      />
      <Typography variant="body2" color="text.secondary">
        {label ?? 'Loading...'}
      </Typography>
    </Stack>
  )

  if (fullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: alpha(isDark ? '#020617' : '#f8fafc', isDark ? 0.72 : 0.74),
          backdropFilter: 'blur(2px)',
        }}
      >
        {loaderContent}
      </Box>
    )
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={center ? { width: '100%', justifyContent: 'center' } : undefined}>
      {loaderContent}
    </Stack>
  )
}

export default CustomLoader
