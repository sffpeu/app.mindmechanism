// Clock colors mapping
export const clockColors = [
  'text-red-500 bg-red-500',
  'text-orange-500 bg-orange-500',
  'text-yellow-500 bg-yellow-500',
  'text-green-500 bg-green-500',
  'text-blue-500 bg-blue-500',
  'text-pink-500 bg-pink-500',
  'text-purple-500 bg-purple-500',
  'text-indigo-500 bg-indigo-500',
  'text-cyan-500 bg-cyan-500'
]

// Clock titles mapping
export const clockTitles = [
  "Galileo's First Observation",
  "Neptune's Discovery",
  "Galileo's Spring Observation",
  "Jupiter's Moons",
  "Uranus Discovery",
  "Saturn's Rings",
  "Ancient Star Charts",
  "Winter Solstice Study",
  "Medieval Observations"
]

// Helper function to get color classes for a clock
export function getClockColorClasses(clockId: number): {
  textColor: string;
  bgColor: string;
  hoverBorder: string;
  hoverShadow: string;
} {
  const color = clockColors[clockId] || 'text-gray-500 bg-gray-500'
  const [textColor, bgColor] = color.split(' ')
  
  return {
    textColor,
    bgColor,
    hoverBorder: `hover:border-${bgColor.split('-')[1]}-500/50`,
    hoverShadow: `hover:shadow-[0_0_15px_rgba(var(--${bgColor.split('-')[1]}-500),0.3)]`
  }
}

// Helper function to get shadow color for a background color
function getShadowColor(bgColor: string): string {
  const colorMap: Record<string, string> = {
    'bg-red-500': 'rgba(239,68,68,0.3)',
    'bg-orange-500': 'rgba(249,115,22,0.3)',
    'bg-yellow-500': 'rgba(234,179,8,0.3)',
    'bg-green-500': 'rgba(34,197,94,0.3)',
    'bg-blue-500': 'rgba(59,130,246,0.3)',
    'bg-pink-500': 'rgba(236,72,153,0.3)',
    'bg-purple-500': 'rgba(147,51,234,0.3)',
    'bg-indigo-500': 'rgba(99,102,241,0.3)',
    'bg-cyan-500': 'rgba(6,182,212,0.3)'
  }
  return colorMap[bgColor] || 'rgba(107,114,128,0.3)'
} 