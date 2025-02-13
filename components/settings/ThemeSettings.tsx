import { useTheme } from '@/app/ThemeContext'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Monitor, Moon, Sun } from 'lucide-react'

export function ThemeSettings() {
  const { setThemePreference, themePreference } = useTheme()

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Appearance</h2>
      <div className="space-y-4">
        <RadioGroup
          value={themePreference}
          onValueChange={(value) => setThemePreference(value as 'light' | 'dark' | 'system')}
          className="grid gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Light Mode
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Dark Mode
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Auto (System)
            </Label>
          </div>
        </RadioGroup>
      </div>
    </Card>
  )
} 