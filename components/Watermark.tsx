import React from 'react';

export function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 200 100" className="opacity-[0.02] dark:opacity-[0.03]">
        <text x="10" y="60" fontFamily="Arial Black" fontSize="60" fontWeight="bold" fill="none" stroke="currentColor" strokeWidth="1">
          1M3
        </text>
      </svg>
    </div>
  );
} 