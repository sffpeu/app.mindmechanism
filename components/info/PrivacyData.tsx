'use client'

export function PrivacyData({ clockHex }: { clockHex: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          Privacy &amp; Data
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Last updated: 29 April 2026
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title="Data controller" clockHex={clockHex}>
        <P>Sean Fortune and Frederic Printz, operating as SFFP. Studio: Viller Mühle, Goch, Germany. Contact: <a href="mailto:contact@sffp.eu" className="underline" style={{ color: clockHex }}>contact@sffp.eu</a></P>
      </Section>

      <HR />

      <Section title="What we collect" clockHex={clockHex}>
        <P>Mind Mechanism does not collect, store, or transmit personal data. The application operates entirely on your device. No account is required. No usage data, analytics, or telemetry is gathered or sent to external servers.</P>
      </Section>

      <HR />

      <Section title="What stays on your device" clockHex={clockHex}>
        <P>Any entries, reflections, or practice records you create within the application are stored locally on your device only. We have no access to this data. If you delete the application, that data is permanently removed.</P>
      </Section>

      <HR />

      <Section title="Third-party services" clockHex={clockHex}>
        <P>Mind Mechanism does not integrate third-party analytics, advertising, or tracking services.</P>
      </Section>

      <HR />

      <Section title="Children" clockHex={clockHex}>
        <P>This application is not directed at children under 16. We do not knowingly collect data from minors.</P>
      </Section>

      <HR />

      <Section title="Your rights (GDPR)" clockHex={clockHex}>
        <P>As a user in the European Economic Area, you have the right to access, correct, or erase any personal data we hold about you. Given that we hold no personal data, these rights are satisfied by design. If you have a question or concern, contact us at <a href="mailto:contact@sffp.eu" className="underline" style={{ color: clockHex }}>contact@sffp.eu</a> and we will respond within 30 days.</P>
      </Section>

      <HR />

      <Section title="Changes to this policy" clockHex={clockHex}>
        <P>If our data practices change, we will update this page and revise the date above. Continued use of the application following any update constitutes acceptance of the revised policy.</P>
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
