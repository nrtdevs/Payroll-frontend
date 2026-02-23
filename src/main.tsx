import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, alpha, createTheme } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { ColorModeContext, type ColorMode } from './context/colorMode'
import { ToastProvider } from './context/toast'
import AuthProvider from './context/authProvider'

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
    () => {
      const isDark = mode === 'dark'
      const primaryMain = isDark ? '#5eead4' : '#0f766e'
      const secondaryMain = isDark ? '#7dd3fc' : '#0369a1'

      return createTheme({
        palette: {
          mode,
          primary: {
            main: primaryMain,
          },
          secondary: {
            main: secondaryMain,
          },
          background: {
            default: isDark ? '#071018' : '#f3f7fb',
            paper: isDark ? '#0f1c2a' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        },
        shape: {
          borderRadius: 14,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundImage: isDark
                  ? 'radial-gradient(circle at 18% 12%, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0) 34%), radial-gradient(circle at 86% 82%, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0) 42%)'
                  : 'radial-gradient(circle at 12% 14%, rgba(13,148,136,0.14) 0%, rgba(13,148,136,0) 34%), radial-gradient(circle at 86% 82%, rgba(14,116,144,0.1) 0%, rgba(14,116,144,0) 42%)',
                backgroundAttachment: 'fixed',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                border: `1px solid ${alpha(isDark ? '#94a3b8' : '#0f172a', isDark ? 0.18 : 0.08)}`,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: isDark ? '0 18px 50px rgba(2, 6, 23, 0.5)' : '0 12px 32px rgba(2, 6, 23, 0.08)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              containedPrimary: {
                backgroundImage: `linear-gradient(135deg, ${primaryMain}, ${secondaryMain})`,
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: 'outlined',
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
              },
            },
          },
        },
      })
    },
    [mode],
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-color-mode', mode)
  }, [mode])

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
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </ColorModeContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
