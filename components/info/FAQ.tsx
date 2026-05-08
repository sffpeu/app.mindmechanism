'use client'

export function FAQ({ clockHex }: { clockHex: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          What it is and how it works.
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      <Section title="The Essentials" clockHex={clockHex}>
        <QA
          q="What is the Mind Mechanism?"
          a="Mind Mechanism is a structured contemplative practice tool. It maps 482 specific points of human interior experience across nine distinct domains — called Wheels — and provides a language for navigating that map. It is built for people who want to understand their inner world with precision and operate from it with authority."
        />
        <QA
          q="Who is it for?"
          a="Two broad groups: language learners who want to acquire English from the inside out rather than through rote memorisation, and anyone engaged in serious self-inquiry — coaches, clinicians, practitioners, or individuals who want a rigorous tool for interior governance rather than a wellness app."
        />
        <QA
          q="Is this a language learning tool?"
          a="Partly — but it is a specific kind of language learning. The Emotional Spectrum Language (ESL) is a 482-node vocabulary of interior states. For students acquiring English as a second language, this becomes the foundation: words learned through genuine emotional connection rather than memorisation. But the system has wider application than language acquisition alone."
        />
        <QA
          q="Is this therapy?"
          a="No. Mind Mechanism is a self-governance tool. It can produce therapeutic effects — clarity, release, reorientation — but it does not diagnose, treat, or manage clinical conditions. There is no practitioner relationship and no treatment protocol. You hold the keys. We provide the map."
        />
      </Section>

      <HR clockHex={clockHex} />

      <Section title="The System" clockHex={clockHex}>
        <QA
          q="What are the 482 nodes?"
          a="The 482 nodes are a taxonomy of interior experience — specific named states that together cover the full emotional, cognitive, and somatic spectrum of human inner life. Each node is a word or phrase that corresponds to a recognisable lived experience. They are organised across nine Wheels and structured to move from foundational physical states up to complex reflective and strategic ones."
        />
        <QA
          q="What are the Nine Wheels?"
          a="Each Wheel is a domain of interior life — a category of experience with its own characteristic vocabulary, challenges, and gifts. They range from Wheel 1 (fundamental physical safety and groundedness) through relational, expressive, and identity domains, to Wheel 9 (integration, expanded awareness, and existential orientation). Most people have a natural resonance with one or two Wheels at any given time."
        />
        <QA
          q="What is the Emotive Prerequisite?"
          a="The Emotive Prerequisite is the principle that durable change — whether in language acquisition, behaviour, or self-understanding — requires genuine emotional engagement, not just intellectual recognition. The Mind Mechanism builds from this premise: you cannot permanently acquire a word, belief, or behaviour by bypassing the feeling state that gives it meaning."
        />
        <QA
          q="What does the sound do?"
          a="Each of the Nine Wheels is associated with a specific acoustic frequency derived from the Cousto system — a set of Hz values calculated from natural planetary and cosmic cycles. These tones are not ambient music. They are a substrate: a frequency environment that supports the nervous system in shifting from a guarded to an open state, which is when interior work becomes possible."
        />
      </Section>

      <HR clockHex={clockHex} />

      <Section title="Using the App" clockHex={clockHex}>
        <QA
          q="How does a session work?"
          a="You select one of the Nine Wheels — either by choosing the domain most relevant to you right now, or by following the system's guidance. You set a session duration. The Wheel rotates, the frequency activates, and you work with the nodes: recognising which ones resonate, which ones feel blocked, which ones open something. You can record observations in the Notes system as you go."
        />
        <QA
          q="What is the three-stage process — Recognise, Authority, Command?"
          a="Recognise: you name a specific interior state using the taxonomy — precisely, not approximately. Authority: by naming it accurately, you cease to be at its mercy. You hold it at a workable distance. Command: from that position, you can direct your own response rather than simply reacting. The sequence is not sequential in practice — it is recursive and ongoing — but it describes the direction of movement."
        />
        <QA
          q="What is the Broadcast feature?"
          a="Broadcast allows you to indicate your live practice presence to others on the same Wheel. It is a light signal — not a chat, not a video call — that creates a sense of shared space. Some practitioners find that knowing others are working the same domain at the same time changes the quality of their own session. It is optional and entirely private in its mechanics."
        />
        <QA
          q="What is a Shadow Pair session?"
          a="A Shadow Pair runs two wheels simultaneously in a single session. You select two wheels, set a duration, and both mandalas rotate at their own speeds for the full session — creating a combined visual field for your practice. Shadow Pairs extend the range of patterns available to meditate with, and are suited to group work or any session where two domains are in active relationship. No focus nodes are required; the session is carried by duration and intention alone. Find it under Sessions → Paired Session."
        />
        <QA
          q="Can I place a video on a wheel face?"
          a="Yes. Each of the nine wheel faces accepts an MP4 file in addition to a static image. Upload it through Settings — the video fills the circular frame edge to edge and remains fixed while the mandala rotates underneath it. When a video is active, a control strip appears at the bottom of the screen with play, pause, stop, restart, ten-second skip, loop toggle, and a dedicated mute button. The video starts muted so it plays automatically without interrupting the wheel tone; tap the sound icon in the strip whenever you want to bring the audio in. The two sound systems — wheel tone and video audio — operate independently of each other."
        />
      </Section>

      <HR clockHex={clockHex} />

      <Section title="The Focus Deck" clockHex={clockHex}>
        <QA
          q="What is the Focus Deck?"
          a="The Focus Deck is a card-based practice layer within the Mind Mechanism. A draw of nodes from any Wheel is laid out as physical-style cards on a table. You flip them, reposition them, annotate them with your own definitions and notes, attach images, and save the configuration as a named session. It is designed for intensive single-node work — slowing down long enough to actually inhabit a term."
        />
        <QA
          q="Can I add images to cards? Are there size or format restrictions?"
          a="Yes — any card and the table background accept an image. There are no restrictions on the file you choose; the system handles the rest automatically. Before upload, every image is compressed to a maximum of 900 × 900 pixels at JPEG 72% quality. In practice, a 4K phone photograph compresses to roughly 80–200 KB; a screenshot to 50–120 KB. The card face itself displays at 240 × 339 pixels, so portrait images fill the frame cleanest. Landscape images are cropped top and bottom. The original file is never stored — only the compressed version reaches Firebase Storage."
        />
        <QA
          q="How many sessions can I save, and are they available across devices?"
          a="Up to 20 named sessions per account. Each session captures the full table state: card positions, flip states, your definitions, notes, and all image references. Sessions are stored in your cloud account — they are not local to a device or browser — so they are available wherever you sign in. The 20-session limit is a deliberate constraint, not a technical one: it encourages curation rather than accumulation."
        />
      </Section>

      <HR clockHex={clockHex} />

      <Section title="Outcomes and Expectations" clockHex={clockHex}>
        <QA
          q="What is Linguistic Sovereignty?"
          a="It is the end-state the system is designed to cultivate: the condition in which language functions as an instrument of your own self-determination rather than a foreign system you are managing. A linguistically sovereign person uses language from the inside — it is not an overlay on their experience but a constituent part of it."
        />
        <QA
          q="How is this different from other language apps or self-development tools?"
          a="Most language apps operate on memorisation and repetition. Most self-development tools operate on insight and behavioural intention. Mind Mechanism operates on the constitutive level — the level below both of those, where the felt relationship between language and experience is established. That is a different intervention at a different level of the architecture."
        />
        <QA
          q="What results can I expect and on what timeline?"
          a="Early sessions often produce recognition — the sense of meeting language that has always applied to you. Sustained practice over weeks produces vocabulary ownership: words that belong to you rather than words you are borrowing. Three to six months of consistent work begins to shift the architecture itself — the relationship between feeling and speech, between interiority and expression. This is not a quick-fix tool. It is a practice."
        />
        <QA
          q="Is my data private?"
          a="Yes. Your practice data — session records, notes, glossary entries — is stored in your personal account and is not shared, sold, or analysed for third-party purposes. The Mind Mechanism is built on a local-first, minimal-collection principle. Your interior work belongs to you."
        />
        <QA
          q="Who built this and why?"
          a="The Mind Mechanism was built by Sean Fortune — writer, artist, and architect of the system — over a period of three decades of interior inquiry, linguistic work, and practice. The taxonomy, the pedagogy, and the application are all original. The question behind the system has always been the same: what does it actually take for language to become a vehicle of the self?"
        />
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
      <h2 className="text-base font-semibold mb-6 tracking-tight" style={{ color: clockHex }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="mb-6">
      <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-snug">{q}</p>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
    </div>
  )
}

function HR({ clockHex }: { clockHex: string }) {
  return (
    <hr className="my-8 border-gray-200 dark:border-gray-800" />
  )
}
