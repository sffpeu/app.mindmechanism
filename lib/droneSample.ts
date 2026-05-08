import { MM_DRONE_PATH } from '@/lib/mmDroneTones'

/** Decode one looped drone .m4a for Web Audio playback */
export async function decodeDroneSample(
  ctx: AudioContext,
  clockIndex: number,
  isCancelled: () => boolean
): Promise<AudioBuffer> {
  const res = await fetch(MM_DRONE_PATH(clockIndex))
  if (!res.ok || isCancelled()) throw new Error(`Drone fetch failed (${res.status})`)
  const ab = await res.arrayBuffer()
  if (isCancelled()) throw new Error('cancelled')
  return ctx.decodeAudioData(ab.slice(0))
}
