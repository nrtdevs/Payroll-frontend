import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { ColorModeContext, type ColorMode } from './context/colorMode'
import { ToastProvider } from './context/toast'

const getInitialMode = (): ColorMode => {
  const savedMode = localStorage.getItem('color_mode')
  if (savedMode === 'light' || savedMode === 'dark') {
    return savedMode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function Root() {
  const [mode, setMode] = useState<ColorMode>(getInitialMode)

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#0f4c81',
          },
          secondary: {
            main: '#0ea5e9',
          },
          background: {
            default: mode === 'dark' ? '#0f172a' : '#f8fafc',
            paper: mode === 'dark' ? '#111827' : '#ffffff',
          },
        },
        shape: {
          borderRadius: 12,
        },
      }),
    [mode],
  )

  const colorModeValue = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => {
          const nextMode: ColorMode = prevMode === 'light' ? 'dark' : 'light'
          localStorage.setItem('color_mode', nextMode)
          return nextMode
        })
      },
    }),
    [mode],
  )

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <ToastProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </ToastProvider>
    </ColorModeContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
