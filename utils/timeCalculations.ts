export function calculateRotation(currentDate: Date, startDateTime: Date, rotationTime: number): number {
  const elapsedMilliseconds = currentDate.getTime() - startDateTime.getTime();
  return (elapsedMilliseconds / rotationTime) * 360;
}

export function getElapsedTime(currentDate: Date, startDateTime: Date): string {
  const elapsed = currentDate.getTime() - startDateTime.getTime();
  const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
  const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

