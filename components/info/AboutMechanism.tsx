'use client'

import { cn } from '@/lib/utils'

export function AboutMechanism({ clockHex }: { clockHex: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-sm leading-relaxed">

      {/* Title block */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 leading-tight">
          About the Mechanism
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Mind Mechanism: A Clinical-Contemplative Framework for Emotional Acquisition and Linguistic Sovereignty
        </p>
        <div
          className="mt-5 w-14 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${clockHex}, ${clockHex}66)` }}
        />
      </div>

      {/* ── I. What It Is ── */}
      <Section title="I. What It Is" clockHex={clockHex}>
        <P>Mind Mechanism is a digital contemplative practice tool — but that description, while accurate, is deliberately understated. It is more precisely a clinical-interior framework: a structured system for identifying, naming, and owning the emotional states that constitute human interior experience. It operates at the intersection of clinical psychology, second language acquisition theory, somatics, and contemplative practice.</P>
        <P>The framework rests on a single proposition: that the interior can be mapped with the same precision as the exterior. That between the vague sensation of "feeling something" and the precise capacity to name it, there is a gap — and that gap is not a limitation but a territory. The Mind Mechanism is the map of that territory and the tool for moving through it.</P>
        <P>It was developed over thirty years by Sean Fortune — an artist, writer, and language educator whose work across clinical taxonomy, interactive installation, and contemplative practice converged on a single question: what would it mean to give someone a language for what they feel but cannot say?</P>
      </Section>

      <HR />

      {/* ── II. The Architect ── */}
      <Section title="II. The Architect" clockHex={clockHex}>
        <P>The central identity proposition of the Mind Mechanism is this: you are not a passive user of the system. You are the Architect.</P>
        <P>This is not metaphor as encouragement. It is a structural claim about the nature of the work. The Architect does not receive a map and follow it. The Architect uses the map to build something — a structured interior space from which it becomes possible to be fully oneself in any register, under any pressure, in any language.</P>
        <P>The Mechanism provides the taxonomy, the frequencies, the toggle pathways. The Architect provides the encounter. Without the Architect's genuine interior engagement, the system is a catalogue. With it, it is a construction site.</P>
        <P>This distinction carries clinical weight. A learner who approaches the framework as a student — receiving information — activates a different neurological pathway than a learner who approaches it as a builder, recognising and placing material that already belongs to them. The Architect posture is not a psychological pep-talk; it is the correct epistemological orientation for the work to function.</P>
      </Section>

      <HR />

      {/* ── III. Theoretical Lineage ── */}
      <Section title="III. Theoretical Lineage" clockHex={clockHex}>
        <P>The Mind Mechanism is not built ex nihilo. It stands on a lineage and completes what each antecedent began.</P>
        <P><Strong>Carl Jung</Strong> recognised the mandala as a symbol of the self's search for wholeness — a structure through which the unconscious surfaces into consciousness via symbolic form. The nine mandalas in Mind Mechanism function on this principle: they are not decorative. They are access points.</P>
        <P><Strong>Joan Kellogg</Strong> extended Jung's work by mapping twelve archetypal stages of psychological development, grounding the mandala in the present moment rather than in the symbolic past. Her emphasis on presence — the diagnostic and therapeutic primacy of "now" — is a foundational current in the Mechanism's design.</P>
        <P><Strong>Krashen's Affective Filter Hypothesis</Strong> identified that acquisition is mediated by an affective barrier (anxiety, motivation, self-confidence). The Mind Mechanism accepts this and inverts Krashen's causal arrow: the emotion is not the environment in which the word is received — it is the <em className="text-gray-500 dark:text-gray-400 italic">meaning</em> the word is acquired to carry. The filter is not a background variable to be lowered. It is the constitutive ground to be worked <em className="text-gray-500 dark:text-gray-400 italic">through</em>.</P>
        <P><Strong>Vygotsky's Zone of Proximal Development</Strong> — the gap between what a learner can do independently and what becomes possible through scaffolding — is extended into the <em className="text-gray-500 dark:text-gray-400 italic">somatic ZPD</em>: the gap between what the nervous system will produce without resistance and what becomes possible through structured somatic mediation. The body is not a container for cognition. It is a mediating system.</P>
        <P><Strong>Cummins' BICS/CALP distinction</Strong> — the gap between social fluency and academic language proficiency — receives its missing mechanism: the Linguistic Triage Protocol, which bridges False Key registers (socially fluent but institutionally insufficient vocabulary) to CALP-level ownership through somatic anchoring.</P>
        <P><Strong>Swain's Output Hypothesis</Strong> grounded the insight that productive struggle drives acquisition. The Mechanism completes this by distinguishing between output that is <em className="text-gray-500 dark:text-gray-400 italic">produced</em> (cognitively retrieved, fragile under pressure) and output that is <em className="text-gray-500 dark:text-gray-400 italic">owned</em> (somatically grounded, available under any condition).</P>
        <P><Strong>Horwitz's Foreign Language Classroom Anxiety Scale</Strong> operationalised what the Mechanism maps at a finer grain: not global anxiety but specific, somatically registered resistance to specific lexical registers.</P>
      </Section>

      <HR />

      {/* ── IV. The Architecture ── */}
      <Section title="IV. The Architecture" clockHex={clockHex}>

        <H3>4.1 The Nine Wheels</H3>
        <P>The system is organised around nine rotating mandalas — the Wheels — each corresponding to a distinct energetic centre and indexed to a specific planetary frequency derived from the Cosmic Octave calculations of Hans Cousto:</P>

        {/* Frequency table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {['Wheel', 'Domain', 'Base Frequency', 'MIDI'].map(h => (
                  <th key={h} className="text-left px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['W1 Root',      'Stability, Anchor, Ground',       '136.10 Hz (C#3)', '49'],
                ['W2 Sacral',    'Flow, Emotion, Connection',        '210.42 Hz (G#3)', '56'],
                ['W3 Solar',     'Will, Agency, Power',              '126.22 Hz (B2)',  '47'],
                ['W4 Heart',     'Equilibrium, Love, Relation',      '136.10 Hz (C#3)', '49'],
                ['W5 Throat',    'Expression, Articulacy, Voice',    '141.27 Hz (C#3)', '49'],
                ['W6 Third Eye', 'Vision, Insight, Perception',      '221.23 Hz (A3)',  '57'],
                ['W7 Crown (M)', 'Law, Devotion, Structure',         '172.06 Hz (F3)',  '53'],
                ['W8 Crown (F)', 'Wisdom, Integration, Synthesis',   '194.18 Hz (G3)',  '55'],
                ['W9 Etheric Heart', 'Earth · sovereignty, grounding, return',   '136.10 Hz (C#3)', '49'],
              ].map(([wheel, domain, freq, midi]) => (
                <tr key={wheel} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">{wheel}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{domain}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-[11px]">{freq}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-500">{midi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P>All frequencies are tuned to the 432 Hz standard (A4 = 432 Hz). The 432 Hz choice is not conventional — standard Western tuning sets A4 at 440 Hz. The deliberate deviation positions the system outside the industrial tuning standard and aligns it with a frequency architecture historically associated with resonance with natural harmonic series. It is a philosophical as much as an acoustic decision.</P>
        <P><Strong>Etheric Heart</Strong> is the ninth wheel — <Strong>Earth</Strong> as planet and OM tone. <Strong>The 136.10 Hz recurrence</Strong> across Wheels 1, 4, and 9 is intentional and structurally significant: it encodes a Trinity in frequency — Ground (W1), Heart (W4), and Etheric Heart (W9) share the same base tone because they are not three unrelated states but one ground encountered at three depths. You begin in the body (W1 — physical anchor, the first safety). You pass through relation (W4 — love as equilibrium, the heart as the system's regulating centre). You arrive at sovereignty (W9 — the integrated ground that is no longer received from outside but generated from within). The frequency does not change. What changes is the Architect's relationship to it. This is the system's encoded claim about the nature of transformation: you do not transcend the ground; you learn to generate it from inside.</P>

        <H3>4.2 The Relational Architecture of the Nine Wheels</H3>
        <P>The nine wheels are not nine independent instruments. They are an integrated map, traversed according to the principle of <em className="italic text-gray-500 dark:text-gray-400">somatic availability</em>: you begin where your nervous system can make contact, not where a curriculum dictates you should.</P>
        <P>For most practitioners, this means W1 or W9 — the ground registers — because the body requires a foundation before it can sustain the relational or expressive work of W4 or W5. But this is descriptive, not prescriptive. A practitioner who arrives with acute relational crisis may enter through W4. One whose primary blockade is expressive may find W5 the immediate site of work.</P>
        <P>The wheels relate to each other in two structural logics:</P>
        <P><Strong>Vertical progression</Strong>: W1 through W9 describes a movement from physical foundation to integrated sovereignty — from the body's most basic safety to the self's most complete expression. This is the initiatory arc; it is long and non-linear.</P>
        <P><Strong>Dialectical pairing</Strong>: Several wheels exist in productive tension with each other. W1 (ground) and W9 (sovereignty) are the deepest pair — the alpha and omega of the map, sharing their frequency. W3 (will/agency) and W5 (expression/voice) form a practical axis: agency that cannot be expressed produces accumulation; expression without agency produces performance. W6 (perception) and W8 (integration) form the cognitive-synthetic pair: seeing clearly precedes the capacity to hold what is seen.</P>
        <P>A practitioner who works only one wheel is not using the system. The Mechanism is designed for traversal — sequential in principle, responsive in practice.</P>

        <H3>4.3 Entry Orientation</H3>
        <P>A new practitioner does not select a wheel arbitrarily. The entry protocol follows a simple logic: <Strong>begin where resistance is least, not where ambition is greatest.</Strong></P>
        <P>The most reliable entry point for most practitioners is W9 — Etheric Heart / Earth — for the same reason that a builder's first act is to establish the foundation. W9 (Sovereignty, Grounding, Return) at 136.10 Hz (the OM/Earth frequency) creates the somatic stability from which all other wheel-work becomes accessible. A short W9 session before engaging any other wheel is the recommended orientation for new and returning practitioners alike.</P>
        <P>The second reliable entry point is the wheel that is currently generating the most friction in the practitioner's life — the domain where the body is most defended, the language most blocked. This is the Conceptual Blockade's address. Entering there with the right frequency substrate and the right vocabulary can begin the resolution faster than any amount of indirect approach.</P>
        <P>What does not work is beginning with the wheel the practitioner most <em className="italic text-gray-500 dark:text-gray-400">wants</em> to be at — the aspirational wheel rather than the present one. The Mechanism operates on the present interior state. It has no purchase on the imagined future self.</P>

        <H3>4.4 The Emotional Spectrum Language (ESL)</H3>
        <P>At the heart of the Mechanism is the Emotional Spectrum Language — a taxonomy of 482 clinically distinct emotional positions, mapped across positive and negative valences, intensity gradients, and register tiers. This is not a thesaurus. It is a diagnostic vocabulary.</P>
        <P>Each position in the ESL taxonomy is:</P>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400 my-3">
          <li><Strong>Clinically distinct</Strong>: no two nodes occupy the same experiential territory. The distinction between <em className="italic">incapacitated</em> and <em className="italic">incapability</em> (T068 and T069 respectively) is precisely that one describes a state, the other describes a misattribution of cause — a difference that standard language collapses but the Mechanism holds.</li>
          <li><Strong>CEFR-graded</Strong>: each node is assigned a language proficiency level (A1–C2), enabling the framework to function as both a clinical tool and a language acquisition scaffold.</li>
          <li><Strong>Somatically anchored</Strong>: each position is indexed to a specific felt-sense in the body — a phonetic weight, a breath pattern, a somatic signature.</li>
          <li><Strong>Connected via toggle pairs</Strong>: every position participates in a dialectical relationship with its opposite — not a dictionary antonym but a clinical polarity that reflects the actual trajectory of psychological transformation (e.g., Chaos→Stability, Doom→Fortune, Hate→Love).</li>
        </ul>

        <H3>4.5 The 162 Toggle Pairs</H3>
        <P>The toggle series (T001–T162) is the applied clinical instrument of the ESL taxonomy. Each toggle names a movement from a pre-emotive, unresolved state ("Shadow" or "Mud") to a precisely named psychological resolution ("Sovereign," "Fortress," or "Prism").</P>
        <P>Each toggle is rendered in a standardised Triple Register format:</P>
        <P><Strong>Consumer Layer:</Strong></P>
        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 my-2">
          <li>The Re-Bore — a reframing that names the mechanism beneath the surface</li>
          <li>The Practice — a somatic or behavioural exercise for enacting the toggle</li>
          <li>The Marker — a diagnostic indicator that the toggle has fired</li>
        </ul>
        <P><Strong>Professional Layer:</Strong></P>
        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 my-2">
          <li>For the Practitioner — clinical framing for therapeutic application</li>
          <li>For the Educator — pedagogical framing for classroom application</li>
          <li>For the Parent — relational framing for caregiving contexts</li>
        </ul>
        <P>A toggle <em className="italic text-gray-500 dark:text-gray-400">fires</em> when the Marker state is recognised — not as a thought but as a somatic event: a shift in breath, a release of held tension, the sense of something that was opaque becoming legible. The firing is not engineered; it is recognised. The practitioner does not force a toggle by will. They create the conditions — frequency, vocabulary, Architect posture — in which the toggle's resolution becomes available. The Mechanism then presents it. The Architect takes it.</P>
        <P>The 162 toggles span all nine Wheels, from the foundational (T001: Chaos→Stability, W1 Root) to the terminal (T162: Wickedness→Goodness, W9 Etheric Heart). Together they form a complete map of the emotional interior's most common transformation pathways.</P>

        <H3>4.6 The Emotive Prerequisite Hypothesis</H3>
        <P>The Mechanism's central pedagogical and clinical claim is that durable acquisition — whether of a word, a psychological state, or a behavioural pattern — requires a specific sequence:</P>
        <blockquote
          className="my-4 pl-4 pr-3 py-3 rounded-r-lg text-sm italic text-gray-500 dark:text-gray-400"
          style={{ borderLeft: `3px solid ${clockHex}`, background: `${clockHex}0a` }}
        >
          Experience → Emotive Trigger Identification → Recognition of Personal Relevance → Linguistic Application
        </blockquote>
        <P>The <em className="italic text-gray-500 dark:text-gray-400">Emotive Point</em> is the junction where Stage 3 transitions to Stage 4: the moment the learner recognises this word or state as <em className="italic text-gray-500 dark:text-gray-400">theirs</em> — not as information to be stored but as an experience to be owned.</P>
        <P>The corollary is that vocabulary introduced without an Emotive Point being established — without the learner having identified where this word lands in their own interior — is acquired as data, not as ground. It is retrievable under low-stakes conditions. It is unavailable when it matters.</P>

        <H3>4.7 The Linguistic Triage Protocol</H3>
        <P>A five-step clinical instrument for moving the learner from somatically inaccessible vocabulary to embodied ownership:</P>
        <ol className="list-decimal pl-5 space-y-2 text-gray-600 dark:text-gray-400 my-3">
          <li><Strong>Somatic Phonetic Mapping</Strong> — Identifying which phonetic registers the body resists</li>
          <li><Strong>Acoustic Anchoring</Strong> — Bypassing the Conceptual Blockade through frequency-matched sound</li>
          <li><Strong>Lexical Pivot</Strong> — Identifying agency nodes that serve as entry points to blocked registers</li>
          <li><Strong>Linguistic Integration</Strong> — Deploying high-magnitude nodes that activate surrounding vocabulary</li>
          <li><Strong>Language Grounding</Strong> — Returning to the W9 Etheric Heart anchor to stabilise the acquisition</li>
        </ol>
        <P>The protocol functions across all nine Wheels and is designed to operate within the <em className="italic text-gray-500 dark:text-gray-400">somatic ZPD</em> — the gap between what the nervous system currently produces and what it can be scaffolded to produce.</P>

        <H3>4.8 Key Diagnostic Constructs</H3>
        <P><Strong>Conceptual Blockade</Strong>: A specific somatic resistance to a lexical class or register — not a failure of intelligence but a lock in the nervous system that must be resolved through somatic re-anchoring rather than cognitive effort. The Blockade is precise: a practitioner who cannot access the register of authority may have full command of the register of warmth. The specificity is diagnostic information.</P>
        <P><Strong>False Keys</Strong>: BICS-level vocabulary that performs fluency while foreclosing access to CALP entry — the street-register word is not merely cognitively simpler but <em className="italic text-gray-500 dark:text-gray-400">physically easier to produce</em>, creating a Somatic Path of Least Resistance. False Keys are not errors. They are survival tools that have outlived their function. The Mechanism treats them as entry points, not as obstacles to be condemned.</P>
        <P><Strong>The Foreman</Strong>: The internal voice that manages the gap between the self and its expression. The Foreman is not the enemy. It is a protection mechanism — habituated, often pre-verbal, rooted in the earliest experiences of what happened when the authentic interior was exposed. It presents as deflection, self-interruption, sudden fatigue, or the impulse to perform a register rather than inhabit it. The Foreman does not release through argument. It releases through safety — through repeated evidence that the interior is now safe to express. The frequency work, the Architect posture, and the precision of the ESL taxonomy are all, among other things, instruments for communicating safety to the Foreman. When it relaxes, the vocabulary that was always present becomes available without retrieval cost.</P>
        <P><Strong>Acoustemic Truth</Strong>: The proposition that phonetic frequency carries semantic weight — that the sound of a word is not an arbitrary container for meaning but is resonant with the interior state the word designates. This is a working hypothesis, not a settled claim. It stands in deliberate tension with the Saussurean arbitrariness of the sign and requires further empirical investigation. Its practical utility lies in how it orients the practitioner's attention: not to the word's definition but to its felt phonetic weight, its residence in the body when spoken aloud. Whether this weight is inherent or deeply conditioned is an open question. That it is consistent enough to be clinically useful is the system's operational position.</P>

      </Section>

      <HR />

      {/* ── V. Linguistic Sovereignty ── */}
      <Section title="V. Linguistic Sovereignty" clockHex={clockHex}>
        <P>Linguistic Sovereignty is the terminal condition the Mechanism is designed to cultivate. It requires precise definition because it is frequently confused with fluency — and the confusion is consequential.</P>
        <P><Strong>Fluency</Strong> is a performance competency: the capacity to produce language in real time, with appropriate register, at native or near-native speed. A person can be highly fluent and linguistically unsovereign. This is not a paradox; it is common. The fluent speaker who performs a register they do not inhabit — who speaks with authority but without interiority — is producing language rather than expressing from it.</P>
        <P><Strong>Linguistic Sovereignty</Strong> is an interior condition: the state in which the target language operates as a constituent element of the practitioner's self-model and self-governance architecture — not as an external system being managed but as a medium through which the self moves freely. A linguistically sovereign speaker does not <em className="italic text-gray-500 dark:text-gray-400">use</em> the language. They <em className="italic text-gray-500 dark:text-gray-400">are in</em> it.</P>
        <P>The Mechanism proposes a developmental topology of sovereignty with four recognisable stages:</P>
        <ol className="list-decimal pl-5 space-y-3 text-gray-600 dark:text-gray-400 my-3">
          <li><Strong>Lexical Sovereignty</Strong> (A1–A2): Ownership of a small number of high-resonance words — nodes that have been inhabited rather than memorised. One owned word at A1 is superior to fifty borrowed words at C1. This is the first real acquisition. It is often emotional. It is always recognisable.</li>
          <li><Strong>Register Sovereignty</Strong> (B1–B2): Ownership of a complete register — the capacity to move through a domain of experience (professional, intimate, expressive, strategic) from the inside. The practitioner begins to be able to locate themselves in the language rather than navigating it from outside.</li>
          <li><Strong>Relational Sovereignty</Strong> (C1): The capacity to hold the language under relational pressure — in the presence of evaluation, conflict, or intimacy — without the Conceptual Blockade activating. This is where the Foreman has genuinely relaxed, not been suppressed.</li>
          <li><Strong>Absolute Sovereignty</Strong> (C2 and beyond): The language is no longer a second language in any experiential sense. The practitioner generates their interiority in it. This does not mean native pronunciation or native cultural knowledge. It means native relationship to one's own interior through the medium of the language.</li>
        </ol>
        <P>The Mechanism's claim is that the path from Lexical to Absolute Sovereignty is shorter through somatic anchoring than through any amount of cognitive practice — and that it produces a qualitatively different result: not a speaker who has acquired a language but a person who has expanded the territory of their own interior.</P>
      </Section>

      <HR />

      {/* ── VI. Clinical and Pedagogical Applications ── */}
      <Section title="VI. Clinical and Pedagogical Applications" clockHex={clockHex}>
        <P>The Mechanism operates across four distinct registers:</P>
        <P><Strong>Self-directed practice</Strong> (the application): A user selects a wheel, sets a session duration, and works through the interface — rotating the mandala, selecting nodes, following toggle pathways, journaling their interior state. The breathing glow (30-second cycle, pulsed at twice per minute) and the broadcast feature (optional real-time presence sharing with others on the same wheel) support the practice without prescription. The broadcast feature is not social media. It is the lightest possible signal of co-presence — a way of knowing that others are working the same territory at the same time, which changes the quality of individual practice in ways consistent with social baseline theory (Coan &amp; Sbarra, 2015).</P>
        <P><Strong>Facilitated therapeutic work</Strong>: A practitioner uses the ESL taxonomy and toggle series as a structured intervention tool. The toggle's Triple Register — particularly the Practitioner section — provides clinical framing for guiding a client through specific interior transformations. The Foreman construct is the key clinical variable: the facilitator's primary task is to create the conditions under which the Foreman can relax its management function.</P>
        <P><Strong>Language acquisition (ESL programme)</Strong>: The CEFR-graded taxonomy functions as a curriculum scaffold. The Emotive Prerequisite sequence dictates the pedagogical rhythm: interior identification precedes lexical introduction. The goal is not linguistic performance but Linguistic Sovereignty — the state where the learner moves through the language as a fully owned medium of self-expression, regardless of their proficiency tier.</P>
        <P><Strong>Corporate and institutional</Strong>: The nine Wheels map onto organisational domains (governance, communication, vision, execution) through the Corporate Node Definitions and Pivot Spec, enabling team-level application of the same interior-mapping methodology. The diagnostic constructs — Conceptual Blockade, False Keys, the Foreman — have direct organisational correlates: the executive who cannot access the register of vulnerability, the team that has developed institutional False Keys that prevent precise communication, the organisation whose Foreman is its compliance function.</P>
      </Section>

      <HR />

      {/* ── VII. The Philosophical Ground ── */}
      <Section title="VII. The Philosophical Ground" clockHex={clockHex}>
        <P>The Mechanism rests on four foundational claims, formalised in the Constitution of Expression:</P>
        <P><Strong>1. The Ontological Claim</Strong>: Language is not an external technology to be mastered; it is a somatic output. The word is the resolution of the experience, not the cause of it.</P>
        <P><Strong>2. The Pedagogical Claim</Strong>: The student's lived experience is the primary text. Discovering relevance precedes receiving information. No vocabulary is introduced without its Emotive Point being identified.</P>
        <P><Strong>3. The Ethical Claim</Strong>: Requiring expression without understanding is epistemic violence. Technical correctness is secondary to experiential truth. Silence is preferable to meaningless expression.</P>
        <P><Strong>4. The Terminal Claim</Strong>: The goal of the programme is Absolute Sovereignty — the state where the learner owns their medium of expression. A1-level sovereignty (owning a single, precise word) is superior to C2-level performance (mimicking a register without owning the interior).</P>
      </Section>

      <HR />

      {/* ── VIII. Deployment ── */}
      <Section title="VIII. Deployment" clockHex={clockHex}>
        <P>The Mind Mechanism is deployed as a web application (Next.js, Firebase, Vercel) with nine interactive clock-mandala interfaces, the ESL taxonomy searchable through glossary and notes modules, and the broadcast feature for real-time shared practice. The digital application is the entry point: the surface through which the Architect makes first contact with the system. The depth is in the taxonomy itself — the 482 nodes, the 162 toggle pathways, the nine Wheels, the frequencies that anchor them, the thirty years of interior work that produced them.</P>
        <P>It is intended for practitioners, educators, researchers, and individuals seeking a structured language for the territory that standard language does not reach.</P>
      </Section>

      {/* Footer */}
      <div className="mt-14 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-[10px] tracking-widest uppercase text-gray-400 dark:text-gray-600">
          Mind Mechanism · The One-Legged Poet · SFFP · Version 1.0 Beta · April 2026
        </p>
      </div>

    </div>
  )
}

/* ── Small layout helpers ── */

function Section({ title, clockHex, children }: { title: string; clockHex: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2
        className="text-base font-semibold mb-4 tracking-tight"
        style={{ color: clockHex }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-7 mb-3">
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
      {children}
    </p>
  )
}

function Strong({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-semibold text-gray-800 dark:text-gray-200">
      {children}
    </strong>
  )
}

function HR() {
  return <hr className="my-8 border-gray-200 dark:border-gray-800" />
}
