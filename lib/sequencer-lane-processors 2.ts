import type { NodeIndex } from '@/lib/sequencer'

export type LaneProcessor = {
  input: AudioNode
  output: AudioNode
}

function makeSaturationCurve(amount: number): Float32Array {
  const curve = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 255 - 1
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x))
  }
  return new Float32Array(curve.buffer.slice(0))
}

function makeWetDryDelay(
  ctx: AudioContext,
  input: AudioNode,
  output: AudioNode,
  delaySec: number,
  wetAmount: number,
  wetGainValue = 1
) {
  const dry = ctx.createGain()
  const wetIn = ctx.createGain()
  const delay = ctx.createDelay()
  const wetGain = ctx.createGain()

  dry.gain.value = Math.max(0, Math.min(1, 1 - wetAmount))
  wetIn.gain.value = Math.max(0, Math.min(1, wetAmount))
  delay.delayTime.value = delaySec
  wetGain.gain.value = wetGainValue

  input.connect(dry)
  dry.connect(output)

  input.connect(wetIn)
  wetIn.connect(delay)
  delay.connect(wetGain)
  wetGain.connect(output)
}

export function buildLaneProcessor(ctx: AudioContext, wheelIndex: NodeIndex): LaneProcessor {
  const input = ctx.createGain()
  const output = ctx.createGain()

  switch (wheelIndex) {
    case 0: {
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 320
      lowpass.Q.value = 2.2

      const lowBoost = ctx.createBiquadFilter()
      lowBoost.type = 'peaking'
      lowBoost.frequency.value = 80
      lowBoost.gain.value = 4
      lowBoost.Q.value = 1

      const gain = ctx.createGain()
      gain.gain.value = 1.15

      input.connect(lowpass)
      lowpass.connect(lowBoost)
      lowBoost.connect(gain)
      gain.connect(output)
      break
    }
    case 1: {
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 340
      bandpass.Q.value = 0.8

      input.connect(bandpass)
      makeWetDryDelay(ctx, bandpass, output, 0.022, 0.25, 0.35)
      break
    }
    case 2: {
      const shaper = ctx.createWaveShaper()
      shaper.curve = makeSaturationCurve(280) as any
      shaper.oversample = '4x'

      const presence = ctx.createBiquadFilter()
      presence.type = 'peaking'
      presence.frequency.value = 2800
      presence.gain.value = 5
      presence.Q.value = 1.4

      const highpass = ctx.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 120
      highpass.Q.value = 0.7

      input.connect(shaper)
      shaper.connect(presence)
      presence.connect(highpass)
      highpass.connect(output)
      break
    }
    case 3: {
      const warmth = ctx.createBiquadFilter()
      warmth.type = 'peaking'
      warmth.frequency.value = 420
      warmth.gain.value = 3
      warmth.Q.value = 0.9

      const shelf = ctx.createBiquadFilter()
      shelf.type = 'highshelf'
      shelf.frequency.value = 6000
      shelf.gain.value = -2

      const post = ctx.createGain()
      post.gain.value = 1

      input.connect(warmth)
      warmth.connect(shelf)
      makeWetDryDelay(ctx, shelf, post, 0.035, 0.3, 1)
      post.connect(output)
      break
    }
    case 4: {
      const presence = ctx.createBiquadFilter()
      presence.type = 'peaking'
      presence.frequency.value = 3500
      presence.gain.value = 2
      presence.Q.value = 2

      const gain = ctx.createGain()
      gain.gain.value = 1

      input.connect(presence)
      presence.connect(gain)
      gain.connect(output)
      break
    }
    case 5: {
      const shimmer = ctx.createBiquadFilter()
      shimmer.type = 'peaking'
      shimmer.frequency.value = 7000
      shimmer.gain.value = 4
      shimmer.Q.value = 1.2

      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 200
      hp.Q.value = 0.5

      const gain = ctx.createGain()
      gain.gain.value = 0.9

      input.connect(shimmer)
      makeWetDryDelay(ctx, shimmer, hp, 0.055, 0.4, 1)
      hp.connect(gain)
      gain.connect(output)
      break
    }
    case 6: {
      const shaper = ctx.createWaveShaper()
      shaper.curve = makeSaturationCurve(80) as any
      shaper.oversample = '4x'

      const body = ctx.createBiquadFilter()
      body.type = 'peaking'
      body.frequency.value = 600
      body.gain.value = 4
      body.Q.value = 0.8

      const warmth = ctx.createBiquadFilter()
      warmth.type = 'peaking'
      warmth.frequency.value = 200
      warmth.gain.value = 2
      warmth.Q.value = 1.2

      const gain = ctx.createGain()
      gain.gain.value = 1.05

      input.connect(shaper)
      shaper.connect(body)
      body.connect(warmth)
      warmth.connect(gain)
      gain.connect(output)
      break
    }
    case 7: {
      const shelf = ctx.createBiquadFilter()
      shelf.type = 'highshelf'
      shelf.frequency.value = 4000
      shelf.gain.value = 4

      const air = ctx.createBiquadFilter()
      air.type = 'peaking'
      air.frequency.value = 9000
      air.gain.value = 3
      air.Q.value = 1.5

      const gain = ctx.createGain()
      gain.gain.value = 0.88

      input.connect(shelf)
      shelf.connect(air)
      makeWetDryDelay(ctx, air, gain, 0.045, 0.35, 1)
      gain.connect(output)
      break
    }
    case 8:
    default: {
      const lowMid = ctx.createBiquadFilter()
      lowMid.type = 'peaking'
      lowMid.frequency.value = 250
      lowMid.gain.value = 2
      lowMid.Q.value = 1

      const mid = ctx.createBiquadFilter()
      mid.type = 'peaking'
      mid.frequency.value = 2000
      mid.gain.value = 2
      mid.Q.value = 1

      const high = ctx.createBiquadFilter()
      high.type = 'peaking'
      high.frequency.value = 7000
      high.gain.value = 1.5
      high.Q.value = 1.5

      const gain = ctx.createGain()
      gain.gain.value = 1

      input.connect(lowMid)
      lowMid.connect(mid)
      mid.connect(high)
      high.connect(gain)
      gain.connect(output)
      break
    }
  }

  return { input, output }
}
