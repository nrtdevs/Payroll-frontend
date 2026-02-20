import { createContext } from 'react'

export type ColorMode = 'light' | 'dark'

export type ColorModeContextValue = {
  mode: ColorMode
  toggleColorMode: () => void
}

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => undefined,
})
