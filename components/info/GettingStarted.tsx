'use client'

export function GettingStarted({ clockHex }: { clockHex: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          Getting Started
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Your first steps with the nine mandalas.
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title="Sign in" clockHex={clockHex}>
        <P>Open Mind Mechanism and sign in with your Google account or email address. Your account holds your personal settings, your dashboard data, and your practice history.</P>
      </Section>

      <HR />

      <Section title="Your home screen" clockHex={clockHex}>
        <P>Once signed in, you arrive at the home screen — a full view of all nine wheels. This is the centre of the mechanism. From here you can navigate to everything else.</P>
      </Section>

      <HR />

      <Section title="The wheels" clockHex={clockHex}>
        <P>The nine wheels are the practice itself. Each one is a timer, and almost every element of it can be customised — the duration, the visual, the intention it carries. You decide what a session looks like for you. The purpose is simple: to encourage focus, and to build the habit of returning to focus. You attach an intention to a wheel — a feeling, a word, a language element, an objective — set it in motion, and hold your attention there for the duration. The wheel does not do the work. It creates the conditions for you to do it.</P>
      </Section>

      <HR />

      <Section title="The glossary" clockHex={clockHex}>
        <P>Inside the app you will find a curated collection of emotional vocabulary drawn from the Emotional Spectrum Language. Use it to find the precise word for what you are working with before you begin a session. You can also add your own words — the glossary grows with your practice.</P>
      </Section>

      <HR />

      <Section title="Your journal" clockHex={clockHex}>
        <P>The notes section is where your journal lives. Record what came up during a session, what shifted, what you want to return to. Over time, the journal becomes a record of the practice.</P>
      </Section>

      <HR />

      <Section title="Your dashboard" clockHex={clockHex}>
        <P>Your dashboard holds information about your activity and your progress. It is personal to you — take a few minutes to read it when you first arrive.</P>
      </Section>

      <HR />

      <Section title="Settings" clockHex={clockHex}>
        <P>Customise your banner, set your personal ID image, and place your own imagery onto individual wheels. The mechanism is designed to reflect you. Don&apos;t leave it on the defaults.</P>
        <P>Each wheel face also accepts an MP4 video file. The video fills the circular face and remains static while the mandala rotates beneath it. A control strip appears at the bottom of the screen when a video is active — giving you play, pause, stop, loop, and seek controls, plus an independent mute toggle that operates separately from the wheel tone. The video starts muted to allow automatic playback; tap the sound icon in the control strip to bring in the audio.</P>
      </Section>

      <HR />

      <Section title="The lobby" clockHex={clockHex}>
        <P>The lobby is where you can signal that you would like to share your meditation with another presence — an open invitation to practise alongside someone without conversation or coordination.</P>
      </Section>

      <HR />

      <Section title="Begin" clockHex={clockHex}>
        <P>Go to the home screen. Choose a wheel. Attach an intention. Start the timer.</P>
      </Section>

      <div className="mt-14 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-gray-600">
          Mind Mechanism · The One-Legged Poet · SFFP · Version 1.0 Beta · April 2026
        </p>
      </div>

    </div>
  )
}

function Section({ title, clockHex, children }: { title: string; clockHex: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2 className="text-base font-semibold mb-4 tracking-tight" style={{ color: clockHex }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
      {children}
    </p>
  )
}

function HR() {
  return <hr className="my-8 border-gray-200 dark:border-gray-800" />
}
