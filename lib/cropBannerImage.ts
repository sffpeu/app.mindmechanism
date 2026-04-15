/**
 * Center-crops any image to a 3:1 banner aspect ratio, then scales to a fixed
 * output size for consistent Storage payloads and display.
 */

const BANNER_ASPECT = 3
const OUTPUT_WIDTH = 1200
const OUTPUT_HEIGHT = 400

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

/**
 * Returns a JPEG blob cropped to 3:1 and scaled to OUTPUT_WIDTH × OUTPUT_HEIGHT.
 */
export async function processBannerImageForUpload(file: File): Promise<Blob> {
  const img = await loadImageFromFile(file)
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) {
    throw new Error('Invalid image dimensions')
  }

  let sx: number
  let sy: number
  let sw: number
  let sh: number
  const ar = iw / ih

  if (ar > BANNER_ASPECT) {
    sh = ih
    sw = ih * BANNER_ASPECT
    sx = (iw - sw) / 2
    sy = 0
  } else if (ar < BANNER_ASPECT) {
    sw = iw
    sh = iw / BANNER_ASPECT
    sx = 0
    sy = (ih - sh) / 2
  } else {
    sx = 0
    sy = 0
    sw = iw
    sh = ih
  }

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_WIDTH
  canvas.height = OUTPUT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create canvas context')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not encode banner image'))
      },
      'image/jpeg',
      0.88
    )
  })
}
