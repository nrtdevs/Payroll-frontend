import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { keyframes } from '@mui/material/styles'

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
            background: '#CF4647',
            animation: `${bounceDot} .5s cubic-bezier(0,800,1,800) infinite`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            outline: `3px solid ${color}`,
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
          background: 'rgba(248,250,252,0.72)',
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
