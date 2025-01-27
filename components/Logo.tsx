import { useTheme } from '@/app/ThemeContext'

export const Logo = () => {
  const { isDarkMode } = useTheme()
  
  return (
    <div className="fixed top-4 left-4 text-2xl font-bold select-none" style={{ color: isDarkMode ? 'white' : 'black' }}>
      M
    </div>
  )
} 