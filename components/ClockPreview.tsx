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
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'transparent',
            border: '2px solid #ef4444'
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

