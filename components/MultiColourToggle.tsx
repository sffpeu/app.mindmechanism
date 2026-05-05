'use client'

export type ColourMode = 'colour' | 'mono'

export function MultiColourToggle({
  mode,
  onChange,
  isDarkMode,
}: {
  mode: ColourMode
  onChange: (m: ColourMode) => void
  isDarkMode: boolean
}) {
  return (
    <div
      className="flex rounded-full overflow-hidden"
      style={{
        fontSize: 9,
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      }}
    >
      {(['colour', 'mono'] as ColourMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className="px-3 py-1 tracking-widest uppercase transition-colors pointer-events-auto"
          style={{
            background:
              mode === m
                ? isDarkMode
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.07)'
                : 'transparent',
            color:
              mode === m
                ? isDarkMode
                  ? 'rgba(255,255,255,0.78)'
                  : 'rgba(0,0,0,0.65)'
                : isDarkMode
                  ? 'rgba(255,255,255,0.3)'
                  : 'rgba(0,0,0,0.3)',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
