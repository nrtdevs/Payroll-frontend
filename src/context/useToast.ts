import { useContext } from 'react'
import { ToastContext } from './toastContext'
import type { ToastContextValue } from './toastContext'

const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.')
  }
  return context
}

export default useToast
