'use client'

export function LegalContact({ clockHex }: { clockHex: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          Legal &amp; Contact
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Version 1.0 — 28 April 2026
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title="Disclaimer" clockHex={clockHex}>
        <P>Mind Mechanism is a contemplative practice tool. It is not a medical device, a therapeutic intervention, or a substitute for professional mental health care. If you are in crisis, please contact a qualified healthcare provider or your local emergency services.</P>
      </Section>

      <HR />

      <Section title="Privacy" clockHex={clockHex}>
        <P>This application does not collect, store, or transmit personal data. No analytics, telemetry, or usage data leaves your device. ¹</P>
      </Section>

      <HR />

      <Section title="Terms of use" clockHex={clockHex}>
        <P>By using this application, you agree to use it as a personal practice aid. You may not reverse-engineer, redistribute, or repurpose the software or its underlying taxonomy — the Emotional Spectrum Language (ESL) — without written permission.</P>
      </Section>

      <HR />

      <Section title="Intellectual property" clockHex={clockHex}>
        <P>The Mind Mechanism application, the ESL taxonomy (482 nodes), the nine mandala designs, the toggle framework, and all associated content are the intellectual property of Sean Fortune and SFFP. © 2026 Sean Fortune and SFFP. All rights reserved.</P>
      </Section>

      <HR />

      <Section title="Liability" clockHex={clockHex}>
        <P>SFFP provides this application as-is, without warranty of any kind. In no event shall SFFP or its principals be liable for any claim, damages, or other liability arising from the use of the application. ²</P>
      </Section>

      <HR />

      <Section title="Contact" clockHex={clockHex}>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <p><a href="mailto:info@mindmechanism.com" className="underline" style={{ color: clockHex }}>info@mindmechanism.com</a></p>
          <p><a href="mailto:contact@mindmechanism.com" className="underline" style={{ color: clockHex }}>contact@mindmechanism.com</a></p>
          <p><a href="https://sffp.eu" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: clockHex }}>sffp.eu</a></p>
          <p className="mt-4 text-gray-500 dark:text-gray-500">Studio: Viller Mühle, Goch, Germany</p>
          <p className="text-gray-500 dark:text-gray-500">Developed by Sean Fortune and Frederic Printz — SFFP.</p>
        </div>
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
