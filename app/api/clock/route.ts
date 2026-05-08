import { NextResponse } from 'next/server';
import { calculateRotation, getElapsedTime } from '../../../utils/timeCalculations';

export async function GET() {
  const currentTime = new Date();
  // Default values for rotation calculation
  const startDateTime = new Date('2024-01-01T00:00:00Z');
  const rotationTime = 60000; // 1 minute in milliseconds
  
  const rotation = calculateRotation(currentTime, startDateTime, rotationTime);
  const elapsedTime = getElapsedTime(currentTime, startDateTime);

  return NextResponse.json({
    currentTime: currentTime.toISOString(),
    rotation,
    elapsedTime,
  });
}

