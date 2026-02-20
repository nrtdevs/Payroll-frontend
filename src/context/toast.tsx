import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { ToastContext } from './toastContext'
import type { ToastSeverity } from './toastContext'

type ToastState = {
  open: boolean
  message: string
  severity: ToastSeverity
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  })

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info') => {
    setToast({
      open: true,
      message,
      severity,
    })
  }, [])

  const onCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }))
  }

  const contextValue = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={onCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={onCloseToast} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
export { ToastProvider }
