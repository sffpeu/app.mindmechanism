'use client'

export function AboutDeveloper({ clockHex }: { clockHex: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          About the Developer
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Sean Fortune — writer, artist, and architect of the Mind Mechanism.
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title="The Architect of the Bleak" clockHex={clockHex}>
        <P>Sean Fortune is a British-born, South London-formed artist, teacher, and architectural thinker. For six decades, he has been &ldquo;counting stars&rdquo; — pulling signal from the noise of a life that included incarceration at sixteen, a diagnostic confirmation of autism at fifty, and the loss of a leg to Buerger&apos;s disease in 2024. These were not obstacles, but the forge. From the static on a Victorian television screen to the 6.2 million words filed in a medieval water mill in Goch, Germany, Sean&apos;s work is dedicated to one thing: the recovery of human sovereignty from the systems that attempt to manipulate it.</P>
      </Section>

      <HR />

      <Section title="Principal Investigator" clockHex={clockHex}>
        <P>The author and architect of the Mind Mechanism methodology. Fortune&apos;s research focuses on the intersection of linguistics, somatic resonance, and phenomenology. His &ldquo;PhD by Publication&rdquo; programme represents the rigorous formalisation of thirty years of instructional evidence gathered within advanced ESL and therapeutic contexts. His work on the &ldquo;Emotive Prerequisite Hypothesis&rdquo; and the &ldquo;Acoustemic Truth&rdquo; provides a substrate-independent reference for Second Language Acquisition (SLA) theory, challenging the cognitive-heavy paradigms of the late 20th century through the implementation of Bio-resonant Phenomenology.</P>
      </Section>

      <HR />

      <Section title="Your Guide and Fellow Architect" clockHex={clockHex}>
        <P>Sean Fortune spent thirty years in classrooms just like yours. He knows what it feels like to have something to say but no words to carry it. He built the Mind Mechanism while surviving the same kinds of pressure, blockages, and &ldquo;whirlwinds&rdquo; that you face. He isn&apos;t just a teacher; he is someone who had to build his own internal map to find his voice. Today, he lives and works in Germany, using this system to help students around the world become the sovereign owners of their own intelligence.</P>
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
