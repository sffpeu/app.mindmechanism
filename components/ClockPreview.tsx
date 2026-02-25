import React from 'react';
import Image from 'next/image';

interface ClockPreviewProps {
  imageUrl: string;
  imageOrientation: number;
  focusNodes: number;
  startingDegree: number;
}

const ClockPreview: React.FC<ClockPreviewProps> = ({
  imageUrl,
  imageOrientation,
  focusNodes,
  startingDegree,
}) => {
  const renderFocusNodes = () => {
    return Array.from({ length: focusNodes }).map((_, index) => {
      const angle = ((360 / focusNodes) * index + startingDegree) % 360;
      const radians = angle * (Math.PI / 180);
      const x = 50 + 48 * Math.cos(radians);
      const y = 50 + 48 * Math.sin(radians);
      return (
        <div
          key={index}
          className="absolute w-2 h-2 rounded-full cursor-pointer"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'transparent',
            border: '2px solid #ef4444',
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)',
            opacity: 0.9,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.5)';
            e.currentTarget.style.opacity = '0.95';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.zIndex = '300';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translate(-50%, -50%)';
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.zIndex = '200';
          }}
        />
      );
    });
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-gray-300">
          <div
            className="absolute inset-0"
            style={{
              transform: `rotate(${imageOrientation}deg)`,
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            <Image
              src={imageUrl}
              alt="Clock Face Preview"
              layout="fill"
              objectFit="cover"
              className="[&_*]:fill-current [&_*]:stroke-none"
            />
          </div>
        </div>
        {renderFocusNodes()}
      </div>
    </div>
  );
};

export default ClockPreview;

