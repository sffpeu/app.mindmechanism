/**
 * seed-glossary-definitions.mjs
 *
 * Seeds the `glossary_definitions` Firestore collection with the 95-node
 * Standard-tier definitions from the Glossy Tabletop Master Definitions document.
 *
 * For words already in `glossary`: writes their `standard` definition.
 * For words in the document not yet in `glossary`: creates the word entry AND the definition.
 *
 * Run:
 *   node scripts/seed-glossary-definitions.mjs
 *
 * Requires: utils/data-mindmechanism-firebase-adminsdk-fbsvc-3558525fda.json
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

initializeApp({
  credential: cert(
    join(dirname(__dirname), 'utils', 'data-mindmechanism-firebase-adminsdk-fbsvc-3558525fda.json')
  ),
})

const db = getFirestore()

// ─── 95-NODE MASTER DEFINITIONS ─────────────────────────────────────────────
// Structure: { word, clockId, definition }
// clockId matches the app's CLOCK_HEX palette index (0-8).
// Word names are canonical — the ALIASES map below handles variant matching.

const DEFINITIONS = [

  // ── WHEEL 1: ROOT (clock_id 0) ──────────────────────────────────────────
  {
    word: 'Command',
    clockId: 0,
    definition: `Command is the ability to exert authority and influence over oneself and the environment. Positively, it breeds self-efficacy, fostering resilience, confidence, and a proactive stance against adversity, reducing anxiety through self-determined agency. Negatively, the exertion of command, particularly in leadership, invites chronic stress. The pressure of decision-making and expectation management can precipitate burnout and conflict if improperly balanced. In summary, command is a double-edged sword in mental health; while it promotes self-efficacy and empowerment, it must be carefully balanced with self-care, vulnerability, and effective stress management to prevent systemic exhaustion and burnout.`,
  },
  {
    word: 'Reflection',
    clockId: 0,
    definition: `Reflection is the deliberate introspection to examine one's thoughts, emotions, and behaviours for deeper understanding. Positively, it benefits mental well-being by identifying hidden stressors, allowing individuals to challenge and reframe destructive cognitive loops into adaptive, resilient strategies. Negatively, if reflection descends into obsessive rumination, it can amplify anxiety and paralyze action rather than facilitating growth. In summary, disciplined reflection promotes profound self-awareness, emotional regulation, and personal growth. It is the necessary pause that transforms raw, unexamined experience into integrated, empowering insight, shifting individuals from reactive survival to intentional living.`,
  },
  {
    word: 'Insight',
    clockId: 0,
    definition: `Insightfulness is the profound understanding of one's own cognitive architecture, emotional triggers, and behavioural patterns. Positively, this self-awareness allows individuals to recognize destructive cycles, make informed decisions, and engage effectively in collaborative therapeutic strategies. Negatively, gaining true insight is an arduous process, demanding the courage to confront deeply uncomfortable truths, which can cause significant initial distress and resistance. In summary, insightfulness is a foundational component of mental health. It promotes self-awareness and emotional regulation, transforming chaotic psychological weather into a navigable landscape, though it requires a commitment to challenging personal growth.`,
  },
  {
    word: 'Illusion',
    clockId: 0,
    definition: `Illusion functions as a cognitive distortion, a protective psychological mechanism where the mind constructs false realities to avoid confronting painful truths. Positively, it may offer a temporary sanctuary from acute trauma or overwhelming distress when reality is unbearable. Negatively, persistent illusion fractures an individual's connection to objective reality, preventing authentic healing and prolonging systemic suffering through self-deception. In summary, while illusion can act as a short-term psychological shield, the systematic dismantling of this comforting mirage is a necessary therapeutic threshold required to rebuild genuine psychological resilience and an authentic, grounded selfhood.`,
  },

  // ── WHEEL 2: SACRAL (clock_id 1) ─────────────────────────────────────────
  {
    word: 'Union',
    clockId: 1,
    definition: `Union is the integration and connection between different aspects of the self, and the deep bonds formed with others. Positively, internal union leads to greater self-awareness and emotional stability, while healthy external relationships provide a strong foundation of trust, empathy, and mutual support that reduces loneliness. Negatively, dysfunctional relationships or a lack of community belonging can contribute to profound stress, anxiety, and emotional fragmentation. In summary, the concept of union—whether achieving internal harmony or building supportive social connections—is vital for promoting emotional stability, self-awareness, and overall life satisfaction, buffering against psychological distress.`,
  },
  {
    word: 'Sturdiness',
    clockId: 1,
    definition: `Sturdiness is the psychological resilience required to withstand stress and adapt to adversity. Positively, individuals with high sturdiness view challenges as opportunities for growth, utilizing strong social support and effective coping strategies like problem-solving and mindfulness to maintain stability. Negatively, a lack of sturdiness leaves individuals vulnerable to being overwhelmed by life's inevitable difficulties, leading to chronic stress, burnout, and an inability to recover quickly from setbacks. In summary, sturdiness is a key component of mental health, involving the capacity to manage stress effectively rather than avoiding it entirely, promoting long-term well-being and emotional resilience.`,
  },
  {
    word: 'Modesty',
    clockId: 1,
    definition: `Modesty is the maintenance of a balanced, realistic view of oneself, recognizing strengths without exaggeration. Positively, it fosters healthy self-esteem and stronger social relationships, as humble individuals are perceived as approachable and trustworthy, while promoting a growth mindset open to self-improvement. Negatively, excessive or unbalanced modesty can lead to self-deprecation, a lack of self-confidence, and the minimization of genuine achievements, which negatively impacts mental health. In summary, cultivating a healthy sense of modesty contributes to positive mental health outcomes by balancing self-confidence with humility, enhancing social connections, and encouraging continuous personal development.`,
  },
  {
    word: 'Surprise',
    clockId: 1,
    definition: `Surprise is an emotional response to unexpected events or information, triggering varied reactions based on perception. Positively, pleasant surprises create moments of joy, excitement, and novelty that stimulate the brain, increase engagement, and enhance overall well-being. Negatively, unexpected bad news or stressful events can disrupt an individual's sense of stability, triggering a fight-or-flight response that leads to acute anxiety and exacerbated mental health issues. In summary, surprise can have both positive and negative effects; developing effective coping strategies and cognitive flexibility is essential to manage unexpected events and reduce their detrimental impact on mental health.`,
  },
  {
    word: 'Joylessness',
    clockId: 1,
    definition: `Joylessness, or anhedonia, is the inability to experience pleasure from activities that were once enjoyable. Positively, recognizing joylessness is a critical diagnostic step in therapy, prompting interventions like behavioural activation to gradually restore the capacity for pleasure and engagement. Negatively, its presence leads to profound social withdrawal, decreased motivation, and exacerbates feelings of hopelessness, serving as a primary and debilitating symptom of depression. In summary, joylessness significantly impairs an individual's quality of life; addressing it requires therapeutic approaches, lifestyle changes, and social support to challenge negative thought patterns and restore overall well-being and emotional vitality.`,
  },

  // ── WHEEL 3: SOLAR PLEXUS (clock_id 2) ───────────────────────────────────
  {
    word: 'Rebirth',
    clockId: 2,
    definition: `Rebirth is the profound psychological renewal of the self, involving the shedding of old, maladaptive patterns and the embracing of new identities. Positively, it facilitates deep personal growth, healing from trauma, and an enlarged, integrated personality with a renewed sense of purpose. Negatively, genuine rebirth is a difficult, often painful transformation; if misunderstood as a temporary change induced by external experiences rather than true internal work, the transformation is shallow and unsustainable. In summary, psychological rebirth represents a critical threshold for long-term mental well-being, requiring a permanent commitment to self-discovery and the courageous abandonment of former constraints to achieve lasting fulfillment.`,
  },
  {
    word: 'Roaring',
    clockId: 2,
    definition: `Roaring functions as a metaphor for assertiveness, power, and the vocal expression of one's boundaries and needs. Positively, it fosters empowerment, enabling individuals to communicate their feelings clearly, establish healthy limits, and build the self-esteem necessary to feel in control of their lives. Negatively, if roaring lacks emotional intelligence or restraint, it can manifest as aggressive dominance, alienating others and creating hostile environments that generate conflict rather than resolution. In summary, roaring is a vital mechanism for psychological empowerment and assertiveness; however, it must be calibrated with empathy to ensure boundaries are maintained without causing relational damage.`,
  },
  {
    word: 'Rampant',
    clockId: 2,
    definition: `Rampancy is the uncontrolled, excessive growth or spread of behaviours, thoughts, or emotions within the psyche. Positively, recognizing rampant patterns is the crucial first step in cognitive-behavioural interventions, allowing individuals to target the specific cognitive loops that require restructuring. Negatively, rampancy manifests as obsessive-compulsive behaviours, severe anxiety, or manic episodes, where intrusive thoughts and uncontrollable actions severely disrupt daily functioning and cause profound psychological distress. In summary, rampancy represents a dangerous escalation of mental activity; addressing it requires therapeutic strategies like mindfulness and cognitive restructuring to regain control over impulsive reactions and restore emotional equilibrium.`,
  },
  {
    word: 'Causing',
    clockId: 2,
    definition: `Causing refers to the complex interplay of biological, psychological, and social factors that trigger or exacerbate mental health conditions. Positively, identifying these root causes enables individuals and therapists to develop targeted, effective interventions, transforming abstract distress into a manageable, comprehensible problem. Negatively, being subjected to severe causative factors—such as trauma, genetic vulnerabilities, or systemic social stress—can precipitate devastating mental health crises, including PTSD and chronic depression. In summary, understanding the multifaceted nature of causing is essential for effective treatment; by mapping the origins of distress, individuals can apply precise coping strategies and build the resilience necessary for recovery.`,
  },
  {
    word: 'Salvage',
    clockId: 2,
    definition: `Salvage is the active, intentional process of recovering and restoring mental health after experiencing significant trauma or distress. Positively, engaging in salvage promotes resilience, re-establishes personal values, and empowers individuals to rebuild their emotional well-being through therapeutic intervention and strong social support. Negatively, the initial stages of salvage require confronting painful realities and accepting vulnerability, which can temporarily heighten distress and cause individuals to resist the necessary healing work. In summary, salvage is a courageous journey of psychological reconstruction; by acknowledging trauma and committing to recovery, individuals can restore their sense of purpose and successfully navigate back to mental stability.`,
  },
  {
    word: 'Pretentions',
    clockId: 2,
    definition: `Pretensions involve striving to appear more important, successful, or knowledgeable than one actually is, often masking deep insecurities. Positively, acknowledging one's pretensions in therapy can serve as a diagnostic gateway to uncovering core vulnerabilities and beginning the work of building genuine self-worth. Negatively, maintaining a facade requires exhausting mental effort, leading to chronic stress, anxiety, and the creation of shallow, inauthentic relationships that foster profound loneliness and isolation. In summary, pretensions act as a fragile psychological shield that ultimately damages mental health; cultivating authenticity and self-compassion is required to dismantle the facade and build sustainable, genuine connections.`,
  },
  {
    word: 'Salaciousness',
    clockId: 2,
    definition: `Salaciousness is an excessive or inappropriate focus on sexual matters. Positively, identifying salacious tendencies can help individuals recognize underlying psychological distress or unmanaged impulses, providing a clear focal point for therapeutic intervention and emotional regulation. Negatively, uncontrolled salacious behaviour often leads to intense feelings of shame, guilt, and low self-esteem, severely straining relationships and contributing to social isolation or conditions like hypersexuality. In summary, salaciousness frequently signals deeper emotional dysregulation; addressing it through therapy and mindfulness can help individuals challenge distorted thoughts, manage urges, and restore a healthy, balanced approach to intimacy and self-worth.`,
  },
  {
    word: 'Aim',
    clockId: 2,
    definition: `Aim is the establishment of clear, purposeful goals that provide structure and direction to an individual's life. Positively, pursuing intrinsic aims boosts self-esteem, fosters resilience against obstacles, and generates a profound sense of accomplishment and life satisfaction upon achievement. Negatively, setting overly ambitious, extrinsic, or unrealistic aims can create chronic pressure, leading to severe stress, anxiety, and burnout when expectations inevitably clash with reality. In summary, having a clear aim is essential for mental well-being, but ambition must be balanced with self-care and realistic milestones to ensure that the pursuit of goals remains fulfilling rather than psychologically destructive.`,
  },
  {
    word: 'Exuberance',
    clockId: 2,
    definition: `Exuberance is a state of high energy, enthusiasm, and joy. Positively, it enhances motivation, stimulates creativity, and fosters strong social connections, acting as an emotional buffer against stress and increasing an individual's overall resilience and life satisfaction. Negatively, unregulated exuberance can lead to impulsive behaviours, poor decision-making, and in extreme cases, may signal the manic phase of underlying mood disorders like bipolar disorder. In summary, while exuberance is a powerful driver of positive mental health and social bonding, it must be balanced with mindfulness and self-awareness to prevent impulsivity and ensure the energy remains a sustainable, constructive force.`,
  },
  {
    word: 'Urge',
    clockId: 2,
    definition: `An urge is an intense internal desire or impulse driven by biological needs, emotional states, or environmental triggers. Positively, when effectively managed, urges can be harnessed as powerful motivational forces that drive individuals to achieve difficult goals and persevere through challenges. Negatively, unmanaged urges can lead to destructive, impulsive behaviours—particularly in the context of addiction—where the inability to resist the impulse causes significant personal, relational, and psychological damage. In summary, urges are potent psychological drivers; developing self-awareness and robust coping strategies is critical to ensuring these impulses are channelled productively rather than allowing them to dictate harmful actions.`,
  },

  // ── WHEEL 4: HEART (clock_id 3) ───────────────────────────────────────────
  {
    word: 'Balancing',
    clockId: 3,
    definition: `Balancing involves managing work, relationships, self-care, and personal growth to promote holistic well-being. Positively, achieving balance reduces stress and burnout, ensuring that energy is sustainably distributed across all areas of life, leading to increased productivity and deep relational fulfilment. Negatively, a lack of balance—such as overworking or neglecting personal responsibilities—causes chronic anxiety, financial stress, and relational friction. In summary, balancing is essential for maintaining mental health; it requires setting firm boundaries, prioritizing tasks, and making intentional time for relaxation and self-care to ensure long-term emotional and physical stability.`,
  },
  {
    word: 'Submerging',
    clockId: 3,
    definition: `Submerging is the act of immersing oneself deeply into a state, emotion, or activity. Positively, submerging in a fulfilling activity or creative endeavour provides a healthy escape from stress, fostering resilience, a sense of accomplishment, and profound psychological flow. Negatively, submerging in maladaptive behaviours, such as substance abuse or obsessive rumination, exacerbates mental health issues by preventing individuals from addressing the root causes of their distress. In summary, while productive submergence is beneficial for mental health, therapeutic interventions like mindfulness are crucial to prevent immersion in negative emotional states and promote overall well-being.`,
  },
  {
    word: 'Attracting',
    clockId: 3,
    definition: `Attracting describes how individuals draw specific experiences, people, or outcomes into their lives based on their mindset and behaviours. Positively, cultivating confidence, empathy, and positive thinking attracts supportive relationships and beneficial opportunities, creating a strong social foundation that reduces loneliness and enhances life satisfaction. Negatively, unresolved trauma or low self-esteem can unconsciously attract toxic relationships and repetitive negative experiences, reinforcing a cycle of psychological distress. In summary, attracting positive outcomes requires conscious effort; addressing underlying trauma through therapy empowers individuals to break negative patterns and purposefully attract healthier, more fulfilling experiences.`,
  },
  {
    word: 'Curiosity',
    clockId: 3,
    definition: `Curiosity is the intrinsic desire to learn, explore, and understand new phenomena. Positively, it promotes cognitive engagement, keeping the mind sharp while fostering emotional well-being through the joy of discovery; it also strengthens social connections by encouraging meaningful interactions with others. Negatively, unchecked curiosity can lead to risky behaviours, boundary violations, or overwhelming information overload, which can spike anxiety and cause significant psychological distress. In summary, curiosity is a powerful driver of personal growth and cognitive health; however, it must be channelled constructively and balanced with caution to avoid detrimental psychological consequences.`,
  },
  {
    word: 'Colliding',
    clockId: 3,
    definition: `Colliding is the internal clash between contradictory thoughts, emotions, or behaviours, often resulting in cognitive dissonance. Positively, recognizing internal collisions is a crucial therapeutic milestone, forcing individuals to confront inconsistencies and prompting the necessary psychological work required for deep personal integration. Negatively, unresolved collisions create immense psychological discomfort, guilt, and emotional turmoil, frequently leading to anxiety, depression, and destructive avoidance behaviours. In summary, internal collisions significantly impact mental health; addressing them through cognitive-behavioural therapy and mindfulness helps individuals align their actions with their values, reducing distress and promoting authentic emotional well-being.`,
  },
  {
    word: 'Concern',
    clockId: 3,
    definition: `Concern is a state of worry or anxiety regarding potential future problems or challenges. Positively, moderate concern functions as a protective motivational force, prompting proactive problem-solving, increased vigilance, and the adoption of healthier lifestyle choices to prevent negative outcomes. Negatively, excessive or chronic concern spirals into overwhelming anxiety, resulting in constant physiological stress, physical tension, and the eventual development of severe anxiety disorders. In summary, while concern is a natural and necessary response to adversity, managing it through therapy and mindfulness is essential to prevent it from deteriorating into paralyzing, chronic anxiety.`,
  },
  {
    word: 'Fate',
    clockId: 3,
    definition: `Fate is the belief that life events are predetermined and ultimately beyond an individual's personal control. Positively, believing in fate can provide immense comfort and peace, helping individuals accept difficult circumstances and reduce anxiety by attributing outcomes to a higher, overarching plan. Negatively, an absolute or excessive belief in fate fosters learned helplessness and resignation, stripping individuals of motivation and personal agency, which can contribute to depression. In summary, the concept of fate requires careful balance; accepting what cannot be changed must be paired with a strong sense of personal self-efficacy to maintain psychological resilience.`,
  },
  {
    word: 'Overbearing',
    clockId: 3,
    definition: `Overbearing behaviour is characterized by excessive control, dominance, and a profound lack of consideration for others' autonomy. Positively, recognizing overbearing tendencies in therapy allows an individual to uncover deep-seated insecurities and begin replacing the need for control with healthy, empathetic communication. Negatively, exhibiting this behaviour causes chronic stress and relationship breakdown, while being subjected to it inflicts feelings of helplessness, low self-esteem, and anxiety upon the victim. In summary, overbearing behaviour damages the mental health of everyone involved; resolving it requires setting firm boundaries and utilizing therapy to develop mutual respect and emotional intelligence.`,
  },
  {
    word: 'Life force',
    clockId: 3,
    definition: `Life force is the vital energy or essence that drives an individual's physical, emotional, and mental well-being. Positively, a strong life force manifests as high energy, enthusiasm, and robust resilience, equipping individuals to pursue goals, cope with stress, and maintain a consistently optimistic outlook on life. Negatively, a diminished life force results in profound fatigue, apathy, and a lack of motivation, acting as a primary precursor to severe burnout, depression, and anxiety. In summary, nurturing the life force through physical activity, healthy nutrition, and purposeful social connection is critical for sustaining overall mental health.`,
  },
  {
    word: 'Protecting',
    clockId: 3,
    definition: `Protecting is the psychological and physical act of setting boundaries, ensuring safety, and fostering a supportive environment. Positively, protecting oneself through firm boundaries prevents burnout, shields against toxic environments, and ensures that caregiving responsibilities are balanced with necessary self-care. Negatively, failing to establish protective boundaries leads to physical exhaustion, severe emotional depletion, and the exacerbation of mental health issues due to chronic overextension and stress. In summary, protecting oneself and others is a fundamental requirement for mental well-being; it demands the intentional creation of safe spaces and the rigorous application of personal boundaries.`,
  },
  {
    word: 'Triumphing',
    clockId: 3,
    definition: `Triumphing is the psychological experience of overcoming severe challenges and achieving meaningful success. Positively, the act of triumphing builds resilience, dramatically boosts self-esteem and self-efficacy, and provides a powerful sense of purpose that motivates individuals to take on future adversity. Negatively, the intense journey required to triumph is often fraught with immense stress and painful setbacks, which can overwhelm individuals if they lack adequate coping mechanisms or social support. In summary, triumphing is vital for mental well-being; however, navigating the stressful path to success requires robust resilience, mindfulness, and the maintenance of a positive outlook.`,
  },
  {
    word: 'Preening',
    clockId: 3,
    definition: `Preening involves behaviours related to grooming, appearance, and physical self-presentation. Positively, taking care of one's appearance can significantly enhance self-esteem, provide a comforting sense of routine and control, and cultivate a sense of pride that supports overall mental well-being. Negatively, an excessive obsession with preening can trigger severe body image issues, extreme anxiety regarding external validation, and debilitating conditions such as body dysmorphic disorder (BDD). In summary, while grooming can boost confidence, it must be balanced with a healthy, intrinsic self-image to prevent appearance from becoming the sole, fragile determinant of an individual's self-worth.`,
  },

  // ── WHEEL 5: THROAT (clock_id 4) ──────────────────────────────────────────
  {
    word: 'Resonating',
    clockId: 4,
    definition: `Resonating is the state of being filled with a deep, full sound or vibrating in harmony with an external force. Positively, internal resonance indicates a high degree of psychological alignment, where an individual's actions, values, and speech are in perfect synchronicity, leading to authentic expression and profound emotional clarity. Negatively, a lack of resonance or being forced to vibrate at a frequency discordant with one's true self causes intense internal friction, leading to cognitive dissonance and chronic stress. In summary, achieving psychological resonance is essential for authentic communication; it transforms raw thought into powerful, harmonious expression that aligns the internal self with the external world.`,
  },
  {
    word: 'Immersing',
    clockId: 4,
    definition: `Immersing is the act of deeply involving oneself in an activity, emotion, or state of being. Positively, total immersion—often described as flow—enhances creativity, accelerates learning, and provides a powerful sense of purpose and psychological well-being. Negatively, immersing oneself in maladaptive emotional states, such as grief or resentment, can lead to psychological stagnation and the inability to engage with the present reality, potentially spiralling into chronic depression. In summary, while productive immersion is a vital driver of personal growth and mastery, developing the mindfulness to intentionally enter and exit these deep states is necessary to maintain overall emotional balance and prevent psychological entrapment.`,
  },
  {
    word: 'Righteous',
    clockId: 4,
    definition: `Righteousness is the adherence to a moral or justifiable standard of conduct. Positively, living a righteous life fosters a deep sense of integrity, self-respect, and inner peace, providing a clear ethical compass that guides decision-making and builds trust within a community. Negatively, if righteousness becomes rigid, judgmental, or self-serving, it alienates others and creates social conflict, ultimately damaging the individual's mental health through isolation and pride. In summary, true righteousness is a powerful source of psychological stability and social cohesion; it must be balanced with humility and empathy to ensure that moral conviction serves as a bridge to others rather than a barrier.`,
  },
  {
    word: 'Compulsion',
    clockId: 4,
    definition: `Compulsion is the overwhelming internal pressure to perform specific actions or maintain certain thoughts, often against one's conscious will. Positively, identifying compulsive patterns is a critical therapeutic threshold, allowing individuals to recognize deep-seated anxieties and begin the work of reclaiming personal agency through cognitive-behavioural strategies. Negatively, unmanaged compulsion disrupts daily functioning, causing intense distress, shame, and the eventual breakdown of personal and professional relationships as the individual loses control over their own behaviour. In summary, compulsion represents a significant challenge to mental health; overcoming it requires professional intervention and the development of robust emotional regulation techniques to break the cycle of anxiety and restore self-determined agency.`,
  },
  {
    word: 'Yearning',
    clockId: 4,
    definition: `Yearning is an intense feeling of longing for something absent or yet to be achieved. Positively, it acts as a powerful motivational catalyst, driving personal ambition and creative expression while connecting individuals to their deepest values and aspirational potential. Negatively, unmanaged yearning can descend into chronic dissatisfaction, causing individuals to live in a state of perpetual lack and emotional void that undermines present-moment fulfillment and precipitates deep anxiety. In summary, yearning is a fundamental human drive; when balanced with mindfulness and gratitude, it serves as a creative fuel that motivates profound psychological growth and the active pursuit of a purposeful life.`,
  },
  {
    word: 'Adapting',
    clockId: 4,
    definition: `Adapting is the psychological and behavioural capacity to modify oneself to suit new environments, uses, or purposes. Positively, being highly adaptive enhances resilience, allowing individuals to successfully navigate life's inevitable changes with mental flexibility and reduced emotional distress. Negatively, over-adapting can lead to the erosion of personal identity, where an individual loses contact with their authentic self to meet external expectations, resulting in cognitive dissonance and profound psychological exhaustion. In summary, the ability to adapt is a critical component of mental well-being; it must be practiced with self-awareness to ensure that external flexibility does not compromise internal integrity or authentic selfhood.`,
  },
  {
    word: 'Fostering',
    clockId: 4,
    definition: `Fostering is the active encouragement and nurturing of growth, development, or specific qualities in oneself or others. Positively, fostering healthy environments and supportive relationships creates a strong sense of community, belonging, and shared purpose, which significantly buffers against isolation and stress. Negatively, failing to foster these supportive systems or neglecting the need for nurturing care leads to emotional depletion, feelings of abandonment, and the stagnation of personal potential. In summary, fostering is an essential mechanism for psychological and social health; by intentionally cultivating growth-oriented environments, individuals can build the resilience and connection necessary for sustained emotional well-being and collective fulfillment.`,
  },
  {
    word: 'Flaunting',
    clockId: 4,
    definition: `Flaunting involves displaying qualities, possessions, or achievements in an ostentatious or boastful manner. Positively, recognizing the urge to flaunt can serve as a diagnostic indicator in therapy, highlighting underlying needs for validation and providing an opportunity to build genuine, internal self-worth. Negatively, persistent flaunting alienates others, creates shallow relational dynamics based on comparison, and frequently masks a fragile ego that is overly dependent on external approval for stability. In summary, while the impulse to flaunt signals a search for significance, replacing this external display with authentic self-confidence and humble self-presentation leads to more secure psychological health and more meaningful social connections.`,
  },
  {
    word: 'Advocating',
    clockId: 4,
    definition: `Advocating is the act of publicly recommending or supporting a specific cause, policy, or individual. Positively, it fosters empowerment and social cohesion, providing individuals with a powerful sense of purpose and the ability to influence positive change within their community. Negatively, constant advocacy without adequate self-care can lead to emotional exhaustion, burnout, and a loss of personal identity as individual needs are sacrificed for the cause. In summary, advocacy is a vital mechanism for psychological and social transformation; balancing external action with internal reflection ensures that the drive for systemic change remains a sustainable and fulfilling part of an individual's life.`,
  },
  {
    word: 'Beguiling',
    clockId: 4,
    definition: `Beguiling involves being charming, enchanting, or attractively deceptive to influence others. Positively, a beguiling nature can facilitate social connection, ease communication, and inspire others through charismatic leadership and creative expression. Negatively, if beguilement is rooted in deception or the intentional manipulation of others for selfish gain, it destroys trust and precipitates profound relational breakdowns that damage the mental health of all involved. In summary, while charm is a powerful social tool, its constructive use requires a foundation of integrity and empathy; without these ethical anchors, beguilement becomes a destructive psychological force that fosters profound isolation and interpersonal conflict.`,
  },
  {
    word: 'Crippling',
    clockId: 4,
    definition: `Crippling refers to severe damage, harm, or a state of extreme psychological disability. Positively, the intense struggle of navigating a crippling experience—whether through trauma or physical loss—can act as a profound catalyst for developing extraordinary resilience and deep emotional maturity. Negatively, being in a crippled state—physically, mentally, or socially—can lead to total despair, hopelessness, and the collapse of an individual's sense of agency and future potential. In summary, a crippling event represents a massive psychological threshold; while it initially causes devastating distress, finding the support and internal strength to survive and adapt is the necessary path toward rebuilding a grounded, authentic selfhood.`,
  },
  {
    word: 'Repairing',
    clockId: 4,
    definition: `Repairing is the intentional act of fixing, mending, or restoring psychological or relational health after damage has occurred. Positively, the process of repairing promotes resilience, restores trust, and provides individuals with the practical tools and emotional regulation necessary to heal from trauma and reconcile with others. Negatively, neglecting the need for repair or attempting shallow fixes for deep psychological wounds allows the damage to fester, leading to chronic stress, resentment, and a permanent state of emotional fragmentation. In summary, the active commitment to repair is essential for long-term mental health; by acknowledging harm and intentionally mending what is broken, individuals can restore their sense of wholeness and connection.`,
  },
  {
    word: 'Transforming',
    clockId: 4,
    definition: `Transforming is the act of making a thorough or dramatic change in form, nature, or appearance. Positively, psychological transformation leads to a profound renewal of the self, where individuals integrate past experiences into a new, empowered identity with a clear sense of purpose. Negatively, resisting necessary transformation or attempting to force a change before the psyche is ready can cause intense inner conflict, anxiety, and a sense of existential loss. In summary, transformation is the core objective of the Mind Mechanism; by courageously embracing systemic change, individuals can transcend former limitations and achieve a deeper, more resilient and authentic state of well-being.`,
  },
  {
    word: 'Suspension',
    clockId: 4,
    definition: `Suspension is the temporary prevention or pause of an activity, state, or emotion. Positively, a deliberate suspension of judgment or action—often through mindfulness or stillness—provides the necessary mental space to process information, reduce stress, and gain clarity before making important life decisions. Negatively, indefinite or involuntary suspension of progress can lead to a sense of paralysis, frustration, and hopelessness, stalling personal growth and fostering a feeling of stagnation. In summary, the intentional use of suspension is a powerful tool for self-regulation; it allows the mind to reset and re-evaluate, ensuring that subsequent actions are intentional, grounded, and aligned with personal values.`,
  },
  {
    word: 'Replanting',
    clockId: 4,
    definition: `Replanting is the act of establishing oneself or a project in a new environment after displacement or failure. Positively, it represents the ultimate expression of resilience, where individuals take the lessons learned from previous experiences and apply them to build new, sustainable structures for their lives. Negatively, the fear of failing again after a major displacement can lead to hesitation, deep-seated anxiety, and a reluctance to fully commit to new opportunities for growth. In summary, replanting is a vital psychological skill; by viewing displacement as a chance for fresh roots, individuals can reconstruct their lives with greater wisdom, strength, and an enduring sense of purpose.`,
  },
  {
    word: 'Reprocessing',
    clockId: 4,
    definition: `Reprocessing, or reverberation, is the act of processing information, trauma, or emotions again to achieve a deeper understanding or resolution. Positively, it allows individuals to re-examine old cognitive loops and reframe them into adaptive, empowering narratives, effectively neutralizing past psychological distress. Negatively, if reprocessing descends into repetitive, circular rumination, it can amplify original trauma and keep the individual trapped in a state of perpetual psychological pain and obsession. In summary, effective reprocessing is essential for authentic healing; by intentionally revisiting and reframing experiences, individuals can transform the lingering echoes of the past into a harmonious foundation for future psychological stability and growth.`,
  },

  // ── WHEEL 6: THIRD EYE (clock_id 5) ──────────────────────────────────────
  // Awakening, Intuition, Clarity, Perception are not yet in Firestore — will be created.
  {
    word: 'Awakening',
    clockId: 5,
    definition: `Awakening is the profound psychological and spiritual realization of one's true nature and the interconnectedness of all life. Positively, it marks a significant threshold in personal growth, leading to increased self-awareness, compassion, and a renewed sense of purpose that transcends former ego-driven constraints. Negatively, the process of awakening can be disorienting and painful, as it often requires the uncomfortable dismantling of long-held beliefs and the confrontation of deep-seated internal shadows. In summary, awakening is a vital transformative process; while it initially causes existential distress, it ultimately leads to a more integrated, authentic selfhood and a profound connection to the wider world.`,
  },
  {
    word: 'Intuition',
    clockId: 5,
    definition: `Intuition is the ability to acquire knowledge or understanding without the use of conscious reasoning, often perceived as an internal gut feeling. Positively, it allows individuals to make rapid, accurate decisions based on deep-seated cognitive patterns and emotional intelligence, fostering creativity and a strong sense of personal agency. Negatively, relying solely on intuition without rational validation can lead to impulsive, biased, or irrational decision-making, potentially causing significant personal and relational harm. In summary, intuition is a powerful cognitive tool for navigating complexity; balancing this internal insight with sober judgment ensures that decisions are both authentic and grounded in reality, promoting overall psychological health.`,
  },
  {
    word: 'Clarity',
    clockId: 5,
    definition: `Clarity is the state of being clear in thought, emotion, and perception, free from confusion or ambiguity. Positively, achieving psychological clarity enables individuals to define their values, set precise goals, and navigate life's challenges with confidence and a reduced sense of anxiety. Negatively, the pursuit of absolute clarity can lead to rigid perfectionism or the inability to tolerate the necessary ambiguity and uncertainty of the human experience, resulting in chronic stress. In summary, clarity is essential for effective decision-making and emotional regulation; cultivating a clear mind allows individuals to move through the world with intentionality and purpose, fostering a sustainable sense of inner peace.`,
  },
  {
    word: 'Perception',
    clockId: 5,
    definition: `Perception is the complex psychological process by which individuals interpret and organize sensory information to understand their environment. Positively, expanding one's perception allows for greater empathy, cognitive flexibility, and a more nuanced understanding of diverse perspectives and internal emotional states. Negatively, distorted or rigid perception—often caused by trauma or deep-seated bias—can lead to chronic misunderstandings, social conflict, and the exacerbation of mental health issues like anxiety and depression. In summary, perception is the foundational lens through which we experience reality; by intentionally broadening this lens through mindfulness and self-reflection, individuals can transform their relationship with themselves and the world.`,
  },
  {
    word: 'Child-like',
    clockId: 5,
    definition: `A child-like attitude is characterized by qualities such as curiosity, openness, spontaneity, and a sense of wonder. Positively, cultivating this mindset fosters creativity, increases joy, and enhances psychological resilience by allowing individuals to approach life's challenges with fresh eyes and a lack of cynical judgment. Negatively, if a child-like attitude descends into childishness or the avoidance of mature responsibilities, it can lead to emotional immaturity and a failure to address the complex demands of adult life. In summary, maintaining a child-like spirit is a powerful buffer against psychological stagnation; it keeps the mind open to discovery while requiring a balance with adult wisdom and accountability.`,
  },
  {
    word: 'Unveiling',
    clockId: 5,
    definition: `Unveiling is the act of revealing or disclosing hidden truths, emotions, or aspects of the self. Positively, the process of unveiling in therapy or self-reflection leads to profound authenticity, emotional release, and the removal of the psychological masks that foster isolation and shame. Negatively, the sudden or forced unveiling of deep trauma or uncomfortable truths before an individual has developed adequate coping mechanisms can cause significant psychological distress and temporary instability. In summary, unveiling is a critical threshold for genuine healing and self-knowledge; by courageously revealing what has been hidden, individuals can dismantle their internal facades and rebuild a more integrated, honest, and resilient selfhood.`,
  },
  {
    word: 'Flight',
    clockId: 5,
    definition: `The flight response is a biological and psychological reaction to perceived threat, involving the urge to escape or avoid danger. Positively, it functions as a vital protective mechanism, ensuring physical and psychological safety in the face of immediate, overwhelming harm. Negatively, if the flight response becomes a chronic, habitual avoidance of non-threatening challenges or emotional discomfort, it leads to increased anxiety, social isolation, and the stagnation of personal growth. In summary, while the impulse to flee is a natural defense, managing this response through mindfulness and therapeutic intervention is essential to prevent it from becoming a debilitating barrier to authentic living and emotional resilience.`,
  },
  {
    word: 'Premonition',
    clockId: 5,
    definition: `A premonition is a strong, intuitive feeling or internal sense that a specific future event is about to occur. Positively, recognizing premonitions can increase an individual's vigilance, helping them prepare for potential challenges and fostering a deeper sense of connection to their internal foresight. Negatively, an obsessive focus on premonitions can lead to chronic paranoia, heightened anxiety regarding the future, and a loss of present-moment groundedness. In summary, premonitions represent the deep, often unconscious predictive power of the mind; by acknowledging these intuitive signals without allowing them to dictate one's entire emotional state, individuals can maintain a balanced, proactive approach to life.`,
  },

  // ── WHEEL 7: MALE CROWN (clock_id 6) ──────────────────────────────────────
  {
    word: 'Seeking',
    clockId: 6,
    definition: `Seeking help involves the intentional act of reaching out to external sources—professionals, community, or divine guidance—when psychological burdens become overwhelming. Positively, it represents a profound moment of self-awareness and strength, allowing individuals to access the resources, empathy, and expertise necessary to navigate through acute trauma or chronic distress. Negatively, failing to seek help due to pride, stigma, or fear leads to severe emotional isolation and the dangerous exacerbation of mental health crises that could otherwise be mitigated. In summary, seeking help is a critical threshold in psychological resilience; by acknowledging vulnerability and accepting support, individuals can begin the essential journey toward healing, stability, and long-term well-being.`,
  },
  {
    word: 'Idealism',
    clockId: 6,
    definition: `Idealism is the psychological pursuit of high principles, perfection, or a vision of how things ought to be. Positively, it acts as a powerful source of motivation and hope, inspiring individuals to strive for excellence, advocate for justice, and envision a more compassionate and fulfilling future for themselves and others. Negatively, excessive idealism can lead to chronic dissatisfaction, perfectionism, and a refusal to engage with the necessary limitations and imperfections of reality, resulting in deep-seated frustration and eventual burnout. In summary, while idealism is a vital driver of human progress and personal aspiration, it must be balanced with realism and self-compassion to ensure that vision remains an empowering force rather than a source of persistent emotional distress.`,
  },
  {
    word: 'Surrendering',
    clockId: 6,
    definition: `Surrendering is the conscious act of yielding control or letting go of the need to dictate outcomes, often in favor of a higher principle or reality. Positively, it brings immense psychological relief, reducing the anxiety of constant struggle and allowing individuals to find peace through acceptance and trust in life's unfolding. Negatively, if surrender is mistaken for total resignation or apathy, it can lead to learned helplessness and the collapse of personal agency, potentially contributing to depression and the abandonment of meaningful goals. In summary, surrender is a profound mechanism for emotional regulation; by releasing the burden of absolute control, individuals can achieve internal stillness and a deeper alignment with their true self and the world.`,
  },
  {
    word: 'Bliss',
    clockId: 6,
    definition: `Bliss is a state of intense, transcendental happiness and spiritual ecstasy. Positively, experiencing moments of bliss provides a deep sense of connection, joy, and profound well-being that acts as a powerful buffer against the inevitable stressors of life, enhancing overall psychological resilience and life satisfaction. Negatively, the obsessive pursuit of bliss can lead to an avoidance of necessary emotional work, where individuals use high-frequency states to bypass reality or ignore the deep-seated trauma that requires healing. In summary, bliss is a vital and transformative emotional state; when integrated into a balanced life, it provides a source of inspiration and renewal that supports a more vibrant, meaningful, and authentic experience of existence.`,
  },
  {
    word: 'Spontaneity',
    clockId: 6,
    definition: `Spontaneity is the quality of acting on natural impulse without premeditation or external constraint. Positively, it fosters creativity, joy, and psychological flexibility, allowing individuals to experience life with a sense of freedom, curiosity, and presence. Negatively, unregulated spontaneity can lead to impulsive, risky behaviours, poor decision-making, and a lack of necessary stability that can disrupt personal and professional environments. In summary, spontaneity is a powerful source of vitality and emotional renewal; by balancing impulsive action with mindful reflection, individuals can harness their creative energy while maintaining the structure and foresight required for a balanced and sustainable life.`,
  },
  {
    word: 'Discourse',
    clockId: 6,
    definition: `Discourse is the structured communication and exchange of ideas between individuals or groups. Positively, engaging in respectful discourse promotes intellectual growth, deepens empathy, and strengthens social connections by allowing for the collaborative exploration of complex truths and diverse perspectives. Negatively, if discourse becomes competitive, dishonest, or aggressive, it creates social conflict, isolation, and psychological distress, ultimately damaging the collective and individual sense of belonging and understanding. In summary, effective discourse is a fundamental mechanism for both personal development and social cohesion; by prioritizing integrity and mutual respect, individuals can transform communication into a powerful tool for mutual understanding and healing.`,
  },
  {
    word: 'Empathy',
    clockId: 6,
    definition: `Empathy is the ability to understand and share the feelings, thoughts, and perspectives of another person. Positively, it is the primary catalyst for deep social connection, fostering compassion, trust, and the supportive environments necessary for collective emotional well-being and trauma recovery. Negatively, excessive empathy without firm psychological boundaries can lead to emotional contagion, where an individual becomes overwhelmed by others' distress, resulting in chronic fatigue and severe burnout. In summary, empathy is an essential and transformative human capacity; by balancing compassionate connection with healthy detachment and self-care, individuals can build meaningful, supportive relationships while maintaining their own emotional stability and resilience.`,
  },
  {
    word: 'Righteousness',
    clockId: 6,
    definition: `Righteousness is the adherence to a moral, ethical, or justifiable standard of conduct. Positively, it provides a profound sense of purpose, integrity, and psychological stability, guiding individuals to act with consistent honour and compassion in accordance with their deepest values. Negatively, if righteousness descends into rigid dogmatism or judgmental superiority, it alienates others, fosters conflict, and prevents the necessary humility required for authentic personal growth and social reconciliation. In summary, true righteousness is a powerful source of ethical clarity and inner peace; it must be tempered with empathy and self-reflection to ensure that moral conviction serves as a bridge to others.`,
  },
  {
    word: 'Prayer',
    clockId: 6,
    definition: `Prayer is the intentional psychological and spiritual act of communicating with a higher power, the deep self, or the universal consciousness. Positively, it provides profound comfort, reduces anxiety through the release of control, and fosters a deep sense of humility and gratitude that enhances overall mental well-being and resilience. Negatively, if prayer becomes a passive bypass for taking necessary physical or psychological action, it can lead to stagnation and a loss of personal agency. In summary, prayer is a transformative tool for self-regulation; by combining internal petition with outward action, individuals can find the spiritual strength and clarity necessary to navigate life's greatest challenges.`,
  },
  {
    word: 'Majesty',
    clockId: 6,
    definition: `Majesty is the psychological experience of witnessing or embodying profound grandeur, dignity, and awe-inspiring power. Positively, it expands an individual's perspective, fostering a sense of reverence for life and a deep realization of one's own inherent dignity and potential for greatness. Negatively, an obsession with external majesty or a distorted sense of one's own majesty can lead to destructive narcissism, arrogance, and the alienation of others. In summary, the experience of majesty is a powerful source of inspiration and self-respect; by acknowledging the grandeur of existence with humility, individuals can cultivate a resilient, dignified self-image that supports their deepest creative and spiritual aspirations.`,
  },
  {
    word: 'Praise',
    clockId: 6,
    definition: `Praise is the vocal or internal expression of approval, admiration, and gratitude toward oneself, others, or a higher principle. Positively, it reinforces positive cognitive loops, boosts self-esteem, and strengthens social bonds by creating an atmosphere of encouragement, validation, and joy. Negatively, a desperate need for constant external praise indicates a fragile ego, leading to chronic anxiety regarding validation and the potential for manipulative, people-pleasing behaviours. In summary, the practice of praise is a vital component of psychological health; by balancing the celebration of excellence with intrinsic self-worth, individuals can foster the positive emotional environments necessary for sustained growth and collective fulfillment.`,
  },
  {
    word: 'Libation',
    clockId: 6,
    definition: `Libation is the ritual act of pouring out an offering, metaphorically representing the sacrifice of personal resources for a higher purpose. Positively, it fosters a spirit of generosity, selfless service, and the realization that one's life gains meaning through contribution and the support of others. Negatively, if the act of pouring oneself out is unbalanced by necessary self-care, it leads to total emotional depletion, severe burnout, and a loss of personal identity. In summary, libation is a profound symbol of psychological transformation; by intentionally offering one's gifts and energy to a greater cause, individuals can achieve a deeper, more meaningful and integrated sense of self.`,
  },
  {
    word: 'Atonement',
    clockId: 6,
    definition: `Atonement is the psychological and spiritual process of making amends for past wrongs to achieve reconciliation and internal peace. Positively, it facilitates deep emotional healing, restores fractured relationships, and allows individuals to move beyond the paralyzing burden of guilt and shame through active, restorative justice. Negatively, failing to seek atonement or attempting to bypass the necessary work of restitution can lead to chronic psychological distress and a permanent state of moral fragmentation. In summary, the commitment to atonement is a transformative threshold; by acknowledging harm and seeking reconciliation, individuals can rebuild their sense of integrity and restore their connection to themselves and their community.`,
  },
  {
    word: 'Ceremony',
    clockId: 6,
    definition: `Ceremonies are structured, symbolic activities that mark significant psychological transitions, collective achievements, or spiritual truths. Positively, they provide a deep sense of belonging, continuity, and shared purpose, helping individuals to integrate life's major milestones and process profound experiences through ritualized expression. Negatively, if ceremonies become empty, rigid, or exclusionary rituals, they can foster social division and prevent the authentic internal processing they were designed to facilitate. In summary, the intentional practice of ceremony is a powerful mechanism for both personal and social integration; by creating sacred spaces for collective expression, individuals can strengthen their psychological resilience and reinforce their connection to a wider human community.`,
  },
  {
    word: 'Temperance',
    clockId: 6,
    definition: `Temperance is the psychological practice of moderation, self-restraint, and balanced emotional regulation. Positively, it fosters long-term stability, protecting individuals from the destructive extremes of excess and helping them to maintain a consistent, grounded sense of self-control and purpose. Negatively, a total lack of temperance leads to impulsive, addictive behaviours that can rapidly erode mental, physical, and relational health, resulting in chronic anxiety and systemic life failure. In summary, cultivating temperance is an essential foundation for sustained well-being; by balancing internal desires with mindful restraint, individuals can ensure that their actions remain aligned with their values and their long-term health and prosperity.`,
  },
  {
    word: 'Release',
    clockId: 6,
    definition: `Release is the intentional psychological act of letting go of past burdens, traumas, anxieties, or the need for absolute control. Positively, it brings immediate and profound emotional relief, allowing individuals to shed the weight of unresolved distress and move into a state of openness, presence, and renewed energy. Negatively, the fear of release or the clinging to familiar pain can trap individuals in a state of perpetual suffering, preventing the necessary healing and growth that only surrender can facilitate. In summary, the practice of release is a critical threshold for transformation; by courageously letting go of what no longer serves the self, individuals can achieve profound internal peace and emotional freedom.`,
  },

  // ── WHEEL 8: FEMALE CROWN (clock_id 7) ───────────────────────────────────
  {
    word: 'Infinity',
    clockId: 7,
    definition: `Infinity is the psychological and spiritual concept of that which is boundless, eternal, and beyond finite measurement. Positively, contemplating infinity expands the mind, fosters a deep sense of awe, and helps individuals transcend immediate, limiting stressors by connecting them to a universal perspective. Negatively, the inability to grasp the vastness of infinity can lead to existential dread, feelings of insignificance, or a loss of groundedness in the necessary, practical demands of daily life. In summary, the idea of infinity is a powerful tool for psychological expansion; by balancing cosmic perspective with present-moment presence, individuals can find the spiritual depth required for lasting resilience and peace.`,
  },
  {
    word: 'Weaving love',
    clockId: 7,
    definition: `Weaving is the symbolic process of integrating disparate life experiences, relationships, and internal states into a coherent, meaningful whole. Positively, it facilitates the creation of a strong, unified personal narrative, where even painful or difficult events are seen as essential threads that contribute to the strength and beauty of the overall self. Negatively, a failure to effectively weave these elements together leads to psychological fragmentation, a lack of purpose, and the feeling that life is a series of disconnected, chaotic events. In summary, weaving is a vital mechanism for narrative integration; by intentionally connecting the threads of experience, individuals can build a resilient, authentic, and integrated sense of selfhood.`,
  },
  {
    word: 'Vibrating',
    clockId: 7,
    definition: `Vibration is the internal emotional and physiological frequency at which an individual exists and expresses themselves. Positively, maintaining a high, joyful vibration—often through gratitude and positive cognitive loops—acts as good medicine, boosting the immune system and fostering the resilience necessary to overcome adversity. Negatively, a crushed spirit or low vibrational state dries up the internal life force, leading to chronic fatigue, depression, and a total loss of psychological vitality. In summary, understanding the vibrational nature of the psyche is essential for self-regulation; by intentionally shifting one's internal frequency through mindfulness and positive action, individuals can restore their emotional health and overall well-being.`,
  },
  {
    word: 'Core centring',
    clockId: 7,
    definition: `Centering, or core centering, is the practice of finding one's internal point of stability and stillness amidst external chaos. Positively, it provides immediate relief from anxiety, allowing individuals to be still and access their deepest wisdom and internal strength before making important life decisions. Negatively, a total lack of centering leaves individuals vulnerable to being constantly overwhelmed by external stressors, leading to chronic emotional instability and the eventual breakdown of psychological resilience. In summary, the ability to center oneself is a fundamental requirement for mental health; by cultivating a dedicated practice of internal stillness, individuals can maintain a grounded, authentic, and resilient presence in the world.`,
  },
  {
    word: 'Purification',
    clockId: 7,
    definition: `Purification is the intentional psychological process of cleansing the mind and heart of toxic thoughts, emotions, and maladaptive patterns. Positively, it fosters profound clarity, inner peace, and a renewed sense of purpose by removing the accumulated weight of trauma and resentment. Negatively, the initial stages of purification are often painful and confronting, as they require an individual to face deeply buried internal shadows and the discomfort of stripping away familiar but destructive cognitive shields. In summary, psychological purification is a transformative gateway to spiritual health; by courageously renewing the internal spirit, individuals can achieve a deeper, more integrated, and vibrant state of authentic well-being.`,
  },
  {
    word: 'Stability',
    clockId: 7,
    definition: `Stability is the mental and emotional foundation that allows individuals to remain grounded and resilient in the face of external stressors. Positively, it acts as a rock and fortress, providing a deep sense of security, self-assurance, and the capacity to maintain a consistent purpose despite life's inevitable fluctuations and challenges. Negatively, a lack of internal stability leaves an individual vulnerable to being easily shaken by circumstance, leading to chronic anxiety, indecision, and a loss of personal agency and future hope. In summary, cultivating stability is a fundamental requirement for psychological health; by building a strong internal foundation, individuals can find refuge and the enduring strength necessary for lasting resilience.`,
  },
  {
    word: 'Kindness',
    clockId: 7,
    definition: `Kindness is the practice of being warm, empathetic, and compassionate toward oneself and others, especially in moments of failure or suffering. Positively, it is a powerful catalyst for social connection and internal healing, fostering the supportive emotional environments required for growth and collective well-being. Negatively, the absence of kindness leads to self-criticism, harsh judgment, and emotional isolation, while excessive or performative kindness without boundaries can result in self-neglect and the eventual collapse of personal energy. In summary, kindness is a vital transformative capacity; by balancing compassion with integrity and self-care, individuals can build more resilient, fulfilling, and supportive relationships, profoundly enhancing their overall psychological health.`,
  },
  {
    word: 'Transformation',
    clockId: 7,
    definition: `Transformation is the thorough or dramatic change in an individual's psychological architecture, leading to a profound renewal of the self. Positively, it facilitates the shedding of old, maladaptive patterns and the adoption of new, empowered identities that are aligned with deep-seated personal values and a sense of purpose. Negatively, the process of transformation is often disruptive and disorienting, as it requires the courageous dismantling of familiar cognitive structures before new ones can be fully integrated. In summary, the Mind Mechanism's core objective is psychological transformation; by embracing the renewing of the mind, individuals can transcend their former limitations and achieve a deeper, more resilient, and authentic state of existence.`,
  },
  // Birthing, Sacrifice, Grace, Co-dependence — not currently in Firestore as Female Crown words.
  // Script will create them as new glossary entries under clock_id 7.
  {
    word: 'Birthing',
    clockId: 7,
    definition: `Birthing is the psychological process of bringing forth new ideas, identities, or states of consciousness. Positively, it represents the ultimate creative act, where an individual transitions from an old, stagnant existence into a vibrant new creation filled with potential and hope. Negatively, the process of birthing is often marked by intense struggle, fear, and the labour of shedding former constraints, which can overwhelm an individual if they lack adequate support. In summary, psychological birthing is a profound threshold for growth; by enduring the necessary tension of change, individuals can successfully bring their deepest aspirations to life and achieve a renewed, authentic sense of self.`,
  },
  {
    word: 'Sacrifice',
    clockId: 7,
    definition: `Sacrifice is the intentional psychological act of relinquishing personal desires, resources, or comfort for a greater good or a deeper purpose. Positively, it is the ultimate expression of love and commitment, fostering profound spiritual depth and strengthening social bonds through selfless service and the prioritisation of collective well-being. Negatively, sacrifice without balance or self-care can lead to total emotional depletion, resentment, and the loss of personal agency as individual needs are chronically neglected. In summary, the capacity for sacrifice is a powerful transformative force; by choosing to offer one's energy to a higher principle, individuals can find a deeper, more meaningful and integrated sense of existence.`,
  },
  {
    word: 'Grace',
    clockId: 7,
    definition: `Grace is the psychological state of receiving unmerited favour, acceptance, and internal peace, even in moments of weakness or failure. Positively, it provides a profound sense of psychological safety and sufficient strength, allowing individuals to accept their limitations and move forward with renewed hope and self-compassion. Negatively, if grace is mistaken for the total avoidance of responsibility or a lack of personal effort, it can lead to stagnation and the failure to address necessary behavioural changes. In summary, the experience of grace is a vital buffer against shame and despair; by accepting internal and external compassion, individuals can find the resilience required to thrive amidst life's inevitable challenges.`,
  },
  {
    word: 'Contingency',
    clockId: 7,
    definition: `Contingency is the psychological realization that events are interconnected and that positive outcomes often emerge from complex, unpredictable circumstances. Positively, it fosters profound hope and trust, allowing individuals to see all things as potentially working together for their ultimate growth and good, even when the immediate reality is difficult. Negatively, a failure to recognize the contingent nature of life can lead to rigid pessimism, feelings of victimhood, and the loss of the mental flexibility required to navigate adversity. In summary, understanding contingency is a powerful source of psychological stability; by embracing the complexity of existence with trust and foresight, individuals can maintain a proactive and resilient approach to life.`,
  },
  {
    word: 'Sensual',
    clockId: 7,
    definition: `Sensuality is the psychological state of being fully present in and through the senses, experiencing the world as a physical, visceral reality. Positively, it fosters deep grounding and the capacity to taste the goodness of existence, allowing individuals to find beauty and pleasure in the material world, which significantly enhances overall well-being and emotional vitality. Negatively, if sensuality becomes a purely hedonistic or disconnected pursuit, it can lead to a loss of internal meaning and a hollow, addictive cycle of sensory consumption. In summary, healthy sensuality is a vital bridge between the self and the world; it provides the sensory anchor necessary for a vibrant, embodied, and authentic life.`,
  },
  {
    word: 'Effort',
    clockId: 7,
    definition: `Effort is the intentional application of mental and physical energy toward achieving a goal, regardless of the difficulty involved. Positively, working with all your heart builds self-efficacy, mastery, and a profound sense of accomplishment that reinforces an individual's psychological resilience and purpose. Negatively, excessive or forced effort without adequate rest leads to chronic stress, physical exhaustion, and the eventual breakdown of both the person and the project through burnout. In summary, the capacity for sustained effort is the primary driver of personal and spiritual growth; when balanced with wisdom and self-care, it ensures that an individual's creative and psychological energy remains a sustainable and fulfilling force.`,
  },
  {
    word: 'Co-dependence',
    clockId: 7,
    definition: `Co-dependence, or interdependence, is the psychological state of mutual reliance, where individuals carry each other's burdens to achieve a greater common good. Positively, healthy co-dependence fosters deep social connection, empathy, and the collective support systems necessary for navigating trauma and maintaining shared resilience. Negatively, if it becomes an unbalanced or unhealthy reliance that erodes personal boundaries and individual identity, it can lead to toxic relational dynamics and a loss of personal agency and mental health. In summary, while isolation is destructive, healthy co-dependence is a vital mechanism for human flourishing; by intentionally supporting one another, individuals can find the communal strength required to sustain themselves through life's challenges.`,
  },
  {
    word: 'Heritage',
    clockId: 7,
    definition: `Lineage is the psychological and historical connection to one's ancestors, heritage, and the generational flow of values and identity. Positively, a strong sense of lineage provides a profound grounding in time, fostering a deep feeling of belonging and a realization that one's life is part of a larger, enduring narrative. Negatively, an obsession with lineage or the refusal to move beyond ancestral trauma can trap individuals in the past, preventing the necessary growth and individualization required for authentic selfhood. In summary, understanding one's lineage is essential for psychological stability; by honoring the past while building the future, individuals can achieve a deeper, more integrated and lasting sense of purpose.`,
  },

  // ── WHEEL 9: ETHERAL HEART (clock_id 8) ──────────────────────────────────
  // Father, Son, Spirit already exist. Brother, Mother, Daughter, Sister, Source are new.
  {
    word: 'Father',
    clockId: 8,
    definition: `Fatherhood is the psychological and biological role of a male parent in providing guidance, protection, and emotional support. Positively, a strong paternal presence fosters a child's sense of security, self-worth, and resilience through compassion and wise leadership. Negatively, the absence of a father or a dysfunctional paternal relationship can lead to deep-seated feelings of abandonment, anxiety, and a fragmented sense of identity and authority. In summary, the role of a father is a foundational pillar of psychological stability; by providing consistent care and guidance, a father helps ground an individual's developing selfhood in a secure and supportive reality.`,
  },
  {
    word: 'Son',
    clockId: 8,
    definition: `A son is a male child in relation to his parents, representing the continuation of lineage and the potential for future growth. Positively, the relationship between parents and a wise, righteous son brings immense joy, pride, and a sense of generational continuity and purpose. Negatively, a fractured or adversarial relationship with a son can cause profound emotional distress, grief, and the breakdown of family cohesion and shared legacy. In summary, the role of a son is essential for the transmission of values and identity; fostering a healthy, mutually respectful relationship ensures the enduring strength of the familial bond and the successful integration of the self.`,
  },
  {
    word: 'Spirit',
    clockId: 8,
    definition: `Spirit is the non-physical, essential core of a person regarded as their true, enduring self and the source of their psychological vitality. Positively, a healthy spirit manifests through love, joy, peace, and self-control, providing the internal strength required to transcend even the most difficult external circumstances. Negatively, a crushed or neglected spirit results in profound apathy, despair, and a total loss of the internal energy needed for resilience and growth. In summary, nurturing the spirit is the ultimate requirement for mental health; by cultivating internal peace and alignment with one's true nature, individuals can achieve a vibrant and indestructible state of well-being.`,
  },
  {
    word: 'Brother',
    clockId: 8,
    definition: `A brother is a male sibling representing a unique bond of shared history, support, and mutual identity. Positively, having a brother provides a lifelong source of unity, companionship, and a superhero level of support that enhances an individual's sense of belonging and resilience. Negatively, adversarial or distant relationships between brothers can lead to lifelong resentment, conflict, and a fragmented sense of social and familial security. In summary, the fraternal bond is a powerful mechanism for mutual empowerment; by living together in unity and supporting one another through adversity, brothers reinforce the social and emotional foundations of their shared lives.`,
  },
  {
    word: 'Mother',
    clockId: 8,
    definition: `Motherhood is the psychological and biological role of a female parent in providing nurturing, unconditional love, and foundational care. Positively, a mother's love acts as a unique and powerful source of emotional security, fostering a child's deep capacity for empathy, trust, and self-compassion. Negatively, the loss of a mother or a dysfunctional maternal relationship can lead to profound emotional voids, attachment issues, and the chronic inability to self-soothe in times of distress. In summary, a mother's role is critical for early psychological development; by providing a secure emotional anchor, she establishes the foundational trust required for an individual to successfully navigate the world.`,
  },
  {
    word: 'Daughter',
    clockId: 8,
    definition: `A daughter is a female child in relation to her parents, representing a beautiful gift of emotional connection and generational potential. Positively, the presence of a daughter brings immense joy and fosters deep emotional bonds of care, love, and mutual growth within the family structure. Negatively, a strained or broken relationship with a daughter can lead to profound grief, feelings of failure, and the disruption of familial harmony and emotional continuity. In summary, the role of a daughter is essential for the emotional richness of the family; by nurturing a respectful and loving relationship, parents ensure the successful transmission of heritage and the enduring strength of the lineage.`,
  },
  {
    word: 'Sister',
    clockId: 8,
    definition: `A sister is a female sibling representing a best friend bond based on shared experience, mutual understanding, and long-term emotional support. Positively, having a sister provides a constant source of companionship, empathy, and a reliable social foundation that buffers against loneliness and adversity. Negatively, sibling rivalry or estrangement between sisters can lead to deep-seated resentment and a loss of the necessary social support systems required for psychological resilience. In summary, the sororal bond is a vital source of lifelong emotional stability; by maintaining a supportive and loving connection, sisters provide each other with a permanent and authentic sense of belonging and security.`,
  },
  {
    word: 'Source',
    clockId: 8,
    definition: `Source refers to the origin of all true greatness and the place from which an individual's life, purpose, and identity originate. Positively, connecting to one's source—whether intellectual, spiritual, or ancestral—provides a profound sense of grounding, mission, and the realization that all things flow from a higher purpose. Negatively, a total disconnection from one's source leads to a fragmented identity, a sense of existential lostness, and the loss of the foundational meaning required for psychological health. In summary, identifying and honoring one's source is essential for sustained well-being; it provides the ultimate anchor for the psyche, ensuring that life remains a purposeful and integrated whole.`,
  },
]

// ─── MATCH HELPERS ──────────────────────────────────────────────────────────
// For words whose canonical name in the document differs from the Firestore entry.
// Key = document word (lowercase), Value = Firestore word name (lowercase)
// Most entries are direct (DEFINITIONS[].word already matches Firestore exactly).
// Only override here when the names genuinely differ.
const FIRESTORE_NAME_OVERRIDE = {
  // These are already set in DEFINITIONS[].word to match Firestore directly:
  // 'Pretentions' (not 'Pretensions'), 'Righteous' (not 'Righteousness' for THROAT),
  // 'Sensual' (not 'Sensuality'), 'Heritage' (not 'Lineage'), etc.
}

function extractSummary(fullText) {
  const match = fullText.match(/In summary[,.]?\s+(.+)$/)
  if (match) return `In summary, ${match[1].trim()}`
  return fullText.split('.')[0] + '.'
}

// ─── MIGRATION ───────────────────────────────────────────────────────────────
async function seedDefinitions() {
  console.log('\n📚  Mind Mechanism — Glossary Definitions Seed')
  console.log('═══════════════════════════════════════════════\n')

  // 1. Load all existing glossary words from Firestore
  const glossarySnap = await db.collection('glossary').get()
  const firestoreWords = new Map() // lowercase word → { id, word, clock_id, ... }
  glossarySnap.forEach((doc) => {
    const data = doc.data()
    if (data.word) {
      firestoreWords.set(data.word.toLowerCase().trim(), { id: doc.id, ...data })
    }
  })
  console.log(`ℹ️  Loaded ${firestoreWords.size} existing glossary entries from Firestore.\n`)

  const toWriteDefs = []    // { id, word, definition } — existing words getting definitions
  const toCreateWords = []  // { word, clockId, definition } — new words to create
  const alreadyHasDef = []  // words that already have a definition entry

  // 2. Check which already have a glossary_definition
  const defSnap = await db.collection('glossary_definitions').get()
  const existingDefs = new Set()
  defSnap.forEach((doc) => existingDefs.add(doc.id))
  console.log(`ℹ️  ${existingDefs.size} definition entries already exist in glossary_definitions.\n`)

  // 3. Match each definition entry against Firestore
  for (const entry of DEFINITIONS) {
    const key = entry.word.toLowerCase().trim()
    const match = firestoreWords.get(key)

    if (match) {
      if (existingDefs.has(match.id)) {
        alreadyHasDef.push(entry.word)
      } else {
        toWriteDefs.push({ id: match.id, word: entry.word, definition: entry.definition })
      }
    } else {
      toCreateWords.push(entry)
    }
  }

  console.log(`✅  ${toWriteDefs.length} definitions to write for existing words.`)
  console.log(`🆕  ${toCreateWords.length} new words to create with definitions.`)
  if (alreadyHasDef.length > 0) {
    console.log(`⏭️  ${alreadyHasDef.length} already have definitions (skipping): ${alreadyHasDef.join(', ')}\n`)
  }

  // 4. Words in Firestore that have no definition source
  const definedWords = new Set(DEFINITIONS.map((d) => d.word.toLowerCase().trim()))
  const undefinedFirestoreWords = []
  firestoreWords.forEach((entry, key) => {
    if (!definedWords.has(key)) undefinedFirestoreWords.push(entry.word)
  })
  if (undefinedFirestoreWords.length > 0) {
    console.log(`\n⚠️  ${undefinedFirestoreWords.length} Firestore words have no matching definition in the master document:`)
    undefinedFirestoreWords.forEach((w) => console.log(`    • ${w}`))
    console.log('    These will not be touched.\n')
  }

  if (toWriteDefs.length === 0 && toCreateWords.length === 0) {
    console.log('\n✨  Nothing to do — all definitions are already seeded.\n')
    return
  }

  // 5. Batch write definitions for existing words (glossary_definitions collection)
  const BATCH_SIZE = 400
  if (toWriteDefs.length > 0) {
    console.log('\n📝  Writing standard definitions for existing words…')
    let batch = db.batch()
    let count = 0
    for (const item of toWriteDefs) {
      const ref = db.collection('glossary_definitions').doc(item.id)
      batch.set(ref, { word_id: item.id, standard: item.definition }, { merge: true })
      count++
      if (count % BATCH_SIZE === 0) {
        await batch.commit()
        console.log(`    Committed batch of ${BATCH_SIZE}…`)
        batch = db.batch()
      }
    }
    if (count % BATCH_SIZE !== 0) await batch.commit()
    console.log(`    ✅  ${toWriteDefs.length} standard definitions written.`)
  }

  // 6. Create new glossary entries + definitions for words not yet in Firestore
  if (toCreateWords.length > 0) {
    console.log('\n🌱  Creating new glossary entries…')
    let batch = db.batch()
    let count = 0
    for (const entry of toCreateWords) {
      const wordRef = db.collection('glossary').doc()
      const summary = extractSummary(entry.definition)
      batch.set(wordRef, {
        id: wordRef.id,
        word: entry.word,
        definition: summary,
        grade: 1,
        phonetic_spelling: '',
        rating: '~',
        source: 'system',
        version: 'Default',
        language: 'en',
        clock_id: entry.clockId,
        created_at: new Date().toISOString(),
      })
      const defRef = db.collection('glossary_definitions').doc(wordRef.id)
      batch.set(defRef, { word_id: wordRef.id, standard: entry.definition })
      count++
      if (count % Math.floor(BATCH_SIZE / 2) === 0) {
        await batch.commit()
        console.log(`    Committed batch…`)
        batch = db.batch()
      }
    }
    if (count > 0) await batch.commit()
    console.log(`    ✅  ${toCreateWords.length} new words created with definitions.`)
    console.log('\n    New words added:')
    toCreateWords.forEach((e) => console.log(`    • ${e.word} (wheel ${e.clockId})`))
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log('✨  Seed complete.\n')
}

seedDefinitions().catch((err) => {
  console.error('\n❌  Seed failed:', err)
  process.exit(1)
})
