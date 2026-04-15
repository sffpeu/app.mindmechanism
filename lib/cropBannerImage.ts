/**
 * Center-crops any image to a 3:1 banner aspect ratio, then scales to a fixed
 * output size for consistent Storage payloads and display.
 */

const BANNER_ASPECT = 3
export const BANNER_OUTPUT_WIDTH = 1200
export const BANNER_OUTPUT_HEIGHT = 400

/** Normalized focal point: (0,0) = top-left, (0.5, 0.5) = center, (1,1) = bottom-right */
export type BannerFocalPoint = { x: number; y: number }

const DEFAULT_FOCAL: BannerFocalPoint = { x: 0.5, y: 0.5 }

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

type BannerSource = {
  width: number
  height: number
  drawTo: (
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => void
  dispose: () => void
}

async function decodeImageForBanner(file: File): Promise<BannerSource> {
  try {
    const bitmap = await createImageBitmap(file)
    if (!bitmap.width || !bitmap.height) {
      bitmap.close()
      throw new Error('Invalid image dimensions')
    }
    return {
      width: bitmap.width,
      height: bitmap.height,
      drawTo(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
        ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh)
      },
      dispose: () => {
        try {
          bitmap.close()
        } catch {
          /* ignore */
        }
      },
    }
  } catch {
    const img = await loadImageFromFile(file)
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    if (!iw || !ih) {
      throw new Error('Invalid image dimensions')
    }
    return {
      width: iw,
      height: ih,
      drawTo(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
      },
      dispose: () => {},
    }
  }
}

/**
 * Largest 3:1 axis-aligned rectangle in the image, positioned so `focal` is centered when possible.
 */
export function computeBannerCropRect(
  iw: number,
  ih: number,
  focal: BannerFocalPoint
): { sx: number; sy: number; sw: number; sh: number } {
  const fx = clamp(focal.x, 0, 1)
  const fy = clamp(focal.y, 0, 1)
  const ar = iw / ih

  let sw: number
  let sh: number

  if (ar > BANNER_ASPECT) {
    sh = ih
    sw = ih * BANNER_ASPECT
  } else if (ar < BANNER_ASPECT) {
    sw = iw
    sh = iw / BANNER_ASPECT
  } else {
    return { sx: 0, sy: 0, sw: iw, sh: ih }
  }

  const focalPxX = fx * iw
  const focalPxY = fy * ih
  let sx = focalPxX - sw / 2
  let sy = focalPxY - sh / 2
  sx = clamp(sx, 0, iw - sw)
  sy = clamp(sy, 0, ih - sh)

  return { sx, sy, sw, sh }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob)
          return
        }
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
          const base64 = dataUrl.split(',')[1]
          if (!base64) {
            reject(new Error('Could not encode banner image'))
            return
          }
          const binary = atob(base64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
          resolve(new Blob([bytes], { type: 'image/jpeg' }))
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Could not encode banner image'))
        }
      },
      'image/jpeg',
      0.88
    )
  })
}

/**
 * Returns a JPEG blob cropped to 3:1 and scaled to OUTPUT size.
 * @param focal Normalized focal point; default center (0.5, 0.5).
 */
export async function processBannerImageForUpload(
  file: File,
  focal: BannerFocalPoint = DEFAULT_FOCAL
): Promise<Blob> {
  const source = await decodeImageForBanner(file)
  try {
    const iw = source.width
    const ih = source.height
    if (!iw || !ih) {
      throw new Error('Invalid image dimensions')
    }

    const { sx, sy, sw, sh } = computeBannerCropRect(iw, ih, focal)

    const canvas = document.createElement('canvas')
    canvas.width = BANNER_OUTPUT_WIDTH
    canvas.height = BANNER_OUTPUT_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not create canvas context')
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    source.drawTo(ctx, sx, sy, sw, sh, 0, 0, BANNER_OUTPUT_WIDTH, BANNER_OUTPUT_HEIGHT)

    return await canvasToJpegBlob(canvas)
  } finally {
    source.dispose()
  }
}
