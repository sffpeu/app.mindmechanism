'use client'

export function AboutESL({ clockHex }: { clockHex: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          Language &amp; Learning
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          The Emotional Spectrum Language — the vocabulary of the interior.
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <P>The language inside Mind Mechanism has been deliberately chosen. Nothing here is accidental.</P>

      <P>The five Doorway Stories — Sam, Lily, Max, Mia, and Emma — are each calibrated to a specific level of English proficiency, from elementary to advanced, using the Common European Framework of Reference for Languages (CEFR). The CEFR is an internationally recognised standard that defines language ability across six levels, from complete beginner to full mastery — used by educators, institutions, and language programmes worldwide. This means the vocabulary, sentence structure, and conceptual complexity of each Doorway Story is matched to what a learner at that level can process without friction.</P>

      <P>This matters because the mechanism only works when the language doesn&apos;t get in the way. If a word costs too much cognitive effort to decode, the somatic grounding — the quiet the practice is designed to reach — is lost before it begins. Language difficulty and emotional availability are directly connected.</P>

      <P>The vocabulary itself draws from the Emotional Spectrum Language (ESL), a 482-node taxonomy developed specifically for this work. The ESL provides a precise, consistent emotional vocabulary across all five Doorway Stories, ensuring that the words used to describe internal states are always intentional, always graded, and always in service of the practice.</P>

      <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
        You are not being simplified. You are being met where you are.
      </p>

      <div className="mt-14 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-gray-600">
          Mind Mechanism · The One-Legged Poet · SFFP · Version 1.0 Beta · April 2026
        </p>
      </div>

    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
      {children}
    </p>
  )
}
