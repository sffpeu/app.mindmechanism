import { createContext, useContext } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  setIsDarkMode: () => {},
})

export const useTheme = () => useContext(ThemeContext) 