export type NodeRate = '+' | '~' | '-'

export interface MandalaNode {
  id: string
  term: string
  phonetic: string
  grade: number
  rate: NodeRate
  definition: string
  wheel: number
  wheelName: string
  nodeId: number
}

export const WHEEL_COLORS: Record<number, string> = {
  1: '#fd290a',
  2: '#fba63b',
  3: '#f7da5f',
  4: '#6dc037',
  5: '#156fde',
  6: '#941952',
  7: '#541b96',
  8: '#ee5fa7',
  9: '#56c1ff',
}

export const CARD_W = 240
export const CARD_H = 339

export const MANDALA_NODES: MandalaNode[] = [
  // Wheel 1 — Root
  { id: 'achievement', term: 'Achievement', phonetic: '/ə.tʃiːv.mənt/', grade: 5, rate: '+', definition: 'A successful result gained through effort.', wheel: 1, wheelName: 'Root', nodeId: 1 },
  { id: 'willingness', term: 'Willingness', phonetic: '/ˈwɪl.ɪŋ.nəs/', grade: 4, rate: '+', definition: 'The quality of being prepared to do something.', wheel: 1, wheelName: 'Root', nodeId: 2 },
  { id: 'vitality', term: 'Vitality', phonetic: '/vaɪˈtæl.ɪ.ti/', grade: 5, rate: '+', definition: 'The state of being strong and active.', wheel: 1, wheelName: 'Root', nodeId: 3 },
  { id: 'boldness', term: 'Boldness', phonetic: '/ˈboʊld.nəs/', grade: 4, rate: '+', definition: 'The quality of having a strong, vivid, or daring appearance.', wheel: 1, wheelName: 'Root', nodeId: 4 },
  { id: 'insight', term: 'Insight', phonetic: '/ˈɪn.saɪt/', grade: 5, rate: '+', definition: 'The capacity to gain an accurate and deep understanding.', wheel: 1, wheelName: 'Root', nodeId: 5 },
  { id: 'command', term: 'Command', phonetic: '/kəˈmænd/', grade: 4, rate: '+', definition: 'The ability to use or control something.', wheel: 1, wheelName: 'Root', nodeId: 6 },
  { id: 'reflection', term: 'Reflection', phonetic: '/rɪˈflɛk.ʃən/', grade: 3, rate: '-', definition: 'Serious thought or consideration.', wheel: 1, wheelName: 'Root', nodeId: 7 },
  { id: 'illusion', term: 'Illusion', phonetic: '/ɪˈluː.ʒən/', grade: 2, rate: '-', definition: 'A false idea or belief.', wheel: 1, wheelName: 'Root', nodeId: 8 },
  // Wheel 2 — Sacral
  { id: 'union', term: 'Union', phonetic: '/ˈjuː.njən/', grade: 4, rate: '+', definition: 'The action of joining together.', wheel: 2, wheelName: 'Sacral', nodeId: 1 },
  { id: 'sturdiness', term: 'Sturdiness', phonetic: '/ˈstɜː.dɪ.nəs/', grade: 4, rate: '+', definition: 'The quality of being strong and solid.', wheel: 2, wheelName: 'Sacral', nodeId: 2 },
  { id: 'insightful', term: 'Insightful', phonetic: '/ɪnˈsaɪt.fəl/', grade: 5, rate: '+', definition: 'Having or showing an accurate and deep understanding.', wheel: 2, wheelName: 'Sacral', nodeId: 3 },
  { id: 'modesty', term: 'Modesty', phonetic: '/ˈmɒd.ɪ.sti/', grade: 4, rate: '+', definition: 'The quality of not being too proud or confident.', wheel: 2, wheelName: 'Sacral', nodeId: 4 },
  { id: 'surprise', term: 'Surprise', phonetic: '/səˈpraɪz/', grade: 3, rate: '~', definition: 'An unexpected or astonishing event.', wheel: 2, wheelName: 'Sacral', nodeId: 5 },
  { id: 'joyless', term: 'Joyless', phonetic: '/ˈdʒɔɪ.ləs/', grade: 1, rate: '-', definition: 'Lacking joy or happiness.', wheel: 2, wheelName: 'Sacral', nodeId: 6 },
  // Wheel 3 — Solar Plexus
  { id: 'rampant', term: 'Rampant', phonetic: '/ˈræm.pənt/', grade: 2, rate: '-', definition: 'Flourishing or spreading unchecked.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 1 },
  { id: 'causing', term: 'Causing', phonetic: '/ˈkɔː.zɪŋ/', grade: 3, rate: '~', definition: 'The act of making something happen.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 2 },
  { id: 'salvage', term: 'Salvage', phonetic: '/ˈsæl.vɪdʒ/', grade: 4, rate: '+', definition: 'The act of saving something from danger or destruction.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 3 },
  { id: 'roaring', term: 'Roaring', phonetic: '/ˈrɔː.rɪŋ/', grade: 3, rate: '-', definition: 'Making a loud, deep sound.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 4 },
  { id: 'pretentions', term: 'Pretentions', phonetic: '/prɪˈtɛn.ʃənz/', grade: 2, rate: '-', definition: 'Attempting to impress by affecting greater importance.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 5 },
  { id: 'salaciousness', term: 'Salaciousness', phonetic: '/səˈleɪ.ʃəs.nəs/', grade: 1, rate: '-', definition: 'The quality of being obscene or indecent.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 6 },
  { id: 'aim', term: 'Aim', phonetic: '/eɪm/', grade: 4, rate: '+', definition: 'A purpose or intention.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 7 },
  { id: 'rebirth', term: 'Rebirth', phonetic: '/riːˈbɜːθ/', grade: 5, rate: '+', definition: 'The process of being born again.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 8 },
  { id: 'exuberance', term: 'Exuberance', phonetic: '/ɪɡˈzjuː.bər.əns/', grade: 5, rate: '+', definition: 'The quality of being full of energy and excitement.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 9 },
  { id: 'urge', term: 'Urge', phonetic: '/ɜːdʒ/', grade: 3, rate: '~', definition: 'A strong desire or impulse.', wheel: 3, wheelName: 'Solar Plexus', nodeId: 10 },
  // Wheel 4 — Heart
  { id: 'balancing', term: 'Balancing', phonetic: '/ˈbæl.ən.sɪŋ/', grade: 4, rate: '+', definition: 'The act of keeping or putting something in a steady position.', wheel: 4, wheelName: 'Heart', nodeId: 1 },
  { id: 'submerging', term: 'Submerging', phonetic: '/səbˈmɜːdʒ.ɪŋ/', grade: 3, rate: '~', definition: 'The act of sinking below the surface.', wheel: 4, wheelName: 'Heart', nodeId: 2 },
  { id: 'attracting', term: 'Attracting', phonetic: '/əˈtræk.tɪŋ/', grade: 4, rate: '+', definition: 'The act of drawing attention or interest.', wheel: 4, wheelName: 'Heart', nodeId: 3 },
  { id: 'curiosity', term: 'Curiosity', phonetic: '/ˌkjʊər.iˈɒs.ɪ.ti/', grade: 4, rate: '+', definition: 'A strong desire to know or learn something.', wheel: 4, wheelName: 'Heart', nodeId: 4 },
  { id: 'clashing', term: 'Clashing', phonetic: '/ˈklæʃ.ɪŋ/', grade: 4, rate: '~', definition: 'The act of coming into conflict or striking together.', wheel: 4, wheelName: 'Heart', nodeId: 5 },
  { id: 'concern', term: 'Concern', phonetic: '/kənˈsɜːn/', grade: 3, rate: '~', definition: 'A matter of interest or importance.', wheel: 4, wheelName: 'Heart', nodeId: 6 },
  { id: 'fate', term: 'Fate', phonetic: '/feɪt/', grade: 3, rate: '~', definition: "The development of events beyond a person's control.", wheel: 4, wheelName: 'Heart', nodeId: 7 },
  { id: 'overbearing', term: 'Overbearing', phonetic: '/ˌoʊv.ərˈbɛər.ɪŋ/', grade: 2, rate: '-', definition: 'Unpleasantly or arrogantly domineering.', wheel: 4, wheelName: 'Heart', nodeId: 8 },
  { id: 'life_force', term: 'Life force', phonetic: '/laɪf fɔːrs/', grade: 4, rate: '+', definition: 'The energy that gives life to living beings.', wheel: 4, wheelName: 'Heart', nodeId: 9 },
  { id: 'protecting', term: 'Protecting', phonetic: '/prəˈtɛk.tɪŋ/', grade: 4, rate: '+', definition: 'The act of keeping someone or something safe.', wheel: 4, wheelName: 'Heart', nodeId: 10 },
  { id: 'triumphing', term: 'Triumphing', phonetic: '/ˈtraɪ.əm.fɪŋ/', grade: 4, rate: '+', definition: 'Achieving a victory or success.', wheel: 4, wheelName: 'Heart', nodeId: 11 },
  { id: 'preening', term: 'Preening', phonetic: '/ˈpriː.nɪŋ/', grade: 2, rate: '-', definition: 'The act of making oneself look attractive.', wheel: 4, wheelName: 'Heart', nodeId: 12 },
  // Wheel 5 — Throat
  { id: 'resonating', term: 'Resonating', phonetic: '/ˈrɛz.ə.neɪ.tɪŋ/', grade: 4, rate: '+', definition: 'Producing or being filled with a deep, full sound.', wheel: 5, wheelName: 'Throat', nodeId: 1 },
  { id: 'immersing', term: 'Immersing', phonetic: '/ɪˈmɜːs.ɪŋ/', grade: 4, rate: '+', definition: 'The act of deeply involving oneself in an activity.', wheel: 5, wheelName: 'Throat', nodeId: 2 },
  { id: 'righteous', term: 'Righteous', phonetic: '/ˈraɪ.tʃəs/', grade: 3, rate: '~', definition: 'Morally right or justifiable.', wheel: 5, wheelName: 'Throat', nodeId: 3 },
  { id: 'compulsion', term: 'Compulsion', phonetic: '/kəmˈpʌl.ʃən/', grade: 2, rate: '~', definition: 'The action or state of forcing or being forced to do something.', wheel: 5, wheelName: 'Throat', nodeId: 4 },
  { id: 'yearning', term: 'Yearning', phonetic: '/ˈjɜːn.ɪŋ/', grade: 3, rate: '~', definition: 'A feeling of intense longing for something.', wheel: 5, wheelName: 'Throat', nodeId: 5 },
  { id: 'adapting', term: 'Adapting', phonetic: '/əˈdæp.tɪŋ/', grade: 4, rate: '+', definition: 'The act of making something suitable for a new use or purpose.', wheel: 5, wheelName: 'Throat', nodeId: 6 },
  { id: 'fostering', term: 'Fostering', phonetic: '/ˈfɒs.tər.ɪŋ/', grade: 4, rate: '+', definition: 'Encouraging the development of something.', wheel: 5, wheelName: 'Throat', nodeId: 7 },
  { id: 'flaunting', term: 'Flaunting', phonetic: '/ˈflɔːnt.ɪŋ/', grade: 2, rate: '-', definition: 'Displaying something ostentatiously.', wheel: 5, wheelName: 'Throat', nodeId: 8 },
  { id: 'advocating', term: 'Advocating', phonetic: '/ˈæd.və.keɪ.tɪŋ/', grade: 4, rate: '+', definition: 'Publicly recommending or supporting something.', wheel: 5, wheelName: 'Throat', nodeId: 9 },
  { id: 'beguiling', term: 'Beguiling', phonetic: '/bɪˈɡaɪ.lɪŋ/', grade: 2, rate: '-', definition: 'Charming or enchanting, often in a deceptive way.', wheel: 5, wheelName: 'Throat', nodeId: 10 },
  { id: 'crippling', term: 'Crippling', phonetic: '/ˈkrɪp.lɪŋ/', grade: 1, rate: '-', definition: 'Causing severe damage or harm.', wheel: 5, wheelName: 'Throat', nodeId: 11 },
  { id: 'repairing', term: 'Repairing', phonetic: '/rɪˈpɛər.ɪŋ/', grade: 4, rate: '+', definition: 'The act of fixing or mending something.', wheel: 5, wheelName: 'Throat', nodeId: 12 },
  { id: 'transforming', term: 'Transforming', phonetic: '/trænsˈfɔːm.ɪŋ/', grade: 5, rate: '+', definition: 'Making a thorough or dramatic change.', wheel: 5, wheelName: 'Throat', nodeId: 13 },
  { id: 'suspension', term: 'Suspension', phonetic: '/səˈspɛn.ʃən/', grade: 3, rate: '~', definition: 'The temporary prevention of something.', wheel: 5, wheelName: 'Throat', nodeId: 14 },
  { id: 'replanting', term: 'Replanting', phonetic: '/riːˈplɑːnt.ɪŋ/', grade: 4, rate: '+', definition: 'The act of planting something again.', wheel: 5, wheelName: 'Throat', nodeId: 15 },
  { id: 'reprocessing', term: 'Reprocessing', phonetic: '/riːˈprəʊ.sɛs.ɪŋ/', grade: 4, rate: '+', definition: 'The act of processing something again.', wheel: 5, wheelName: 'Throat', nodeId: 16 },
  // Wheel 6 — Third Eye
  { id: 'child_like', term: 'Child-like', phonetic: '/tʃaɪld laɪk/', grade: 4, rate: '+', definition: 'Having qualities associated with a child.', wheel: 6, wheelName: 'Third Eye', nodeId: 1 },
  { id: 'unveiling', term: 'Unveiling', phonetic: '/ʌnˈveɪl.ɪŋ/', grade: 4, rate: '+', definition: 'The act of revealing something.', wheel: 6, wheelName: 'Third Eye', nodeId: 2 },
  { id: 'flight', term: 'Flight', phonetic: '/flaɪt/', grade: 3, rate: '~', definition: 'The act of flying or moving through the air.', wheel: 6, wheelName: 'Third Eye', nodeId: 3 },
  { id: 'premonition', term: 'Premonition', phonetic: '/ˌprɛm.əˈnɪʃ.ən/', grade: 3, rate: '~', definition: 'A strong feeling that something is about to happen.', wheel: 6, wheelName: 'Third Eye', nodeId: 4 },
  // Wheel 7 — Male Crown
  { id: 'seeking', term: 'Seeking', phonetic: '/ˈsiːk.ɪŋ/', grade: 4, rate: '+', definition: 'The act of looking for or trying to find something.', wheel: 7, wheelName: 'Male Crown', nodeId: 1 },
  { id: 'idealism', term: 'Idealism', phonetic: '/aɪˈdiː.ə.lɪz.əm/', grade: 4, rate: '+', definition: 'The practice of forming or pursuing ideals.', wheel: 7, wheelName: 'Male Crown', nodeId: 2 },
  { id: 'surrendering', term: 'Surrendering', phonetic: '/səˈrɛnd.ər.ɪŋ/', grade: 3, rate: '~', definition: 'The act of giving up or yielding.', wheel: 7, wheelName: 'Male Crown', nodeId: 3 },
  { id: 'bliss', term: 'Bliss', phonetic: '/blɪs/', grade: 5, rate: '+', definition: 'Perfect happiness or joy.', wheel: 7, wheelName: 'Male Crown', nodeId: 4 },
  { id: 'spontaneity', term: 'Spontaneity', phonetic: '/ˌspɒn.təˈneɪ.ɪ.ti/', grade: 4, rate: '+', definition: 'The quality of being spontaneous.', wheel: 7, wheelName: 'Male Crown', nodeId: 5 },
  { id: 'discourse', term: 'Discourse', phonetic: '/ˈdɪs.kɔːrs/', grade: 3, rate: '~', definition: 'Written or spoken communication or debate.', wheel: 7, wheelName: 'Male Crown', nodeId: 6 },
  { id: 'empathy', term: 'Empathy', phonetic: '/ˈɛm.pə.θi/', grade: 5, rate: '+', definition: 'The ability to understand and share the feelings of another.', wheel: 7, wheelName: 'Male Crown', nodeId: 7 },
  { id: 'righteousness', term: 'Righteousness', phonetic: '/ˈraɪ.tʃəs.nəs/', grade: 3, rate: '~', definition: 'The quality of being morally right or justifiable.', wheel: 7, wheelName: 'Male Crown', nodeId: 8 },
  { id: 'prayer', term: 'Prayer', phonetic: '/prɛr/', grade: 4, rate: '+', definition: 'A solemn request for help or expression of thanks addressed to God.', wheel: 7, wheelName: 'Male Crown', nodeId: 9 },
  { id: 'majesty', term: 'Majesty', phonetic: '/ˈmædʒ.ɪ.sti/', grade: 4, rate: '+', definition: 'Impressive beauty or scale.', wheel: 7, wheelName: 'Male Crown', nodeId: 10 },
  { id: 'praise', term: 'Praise', phonetic: '/preɪz/', grade: 5, rate: '+', definition: 'The expression of approval or admiration.', wheel: 7, wheelName: 'Male Crown', nodeId: 11 },
  { id: 'libation', term: 'Libation', phonetic: '/laɪˈbeɪ.ʃən/', grade: 3, rate: '~', definition: 'A drink poured out as an offering to a deity.', wheel: 7, wheelName: 'Male Crown', nodeId: 12 },
  { id: 'atonement', term: 'Atonement', phonetic: '/əˈtoʊn.mənt/', grade: 4, rate: '+', definition: 'The action of making amends for a wrong.', wheel: 7, wheelName: 'Male Crown', nodeId: 13 },
  { id: 'ceremony', term: 'Ceremony', phonetic: '/ˈsɛr.ə.moʊ.ni/', grade: 4, rate: '+', definition: 'A formal event held on a special occasion.', wheel: 7, wheelName: 'Male Crown', nodeId: 14 },
  { id: 'temperance', term: 'Temperance', phonetic: '/ˈtɛm.pər.əns/', grade: 4, rate: '+', definition: 'Moderation or self-restraint.', wheel: 7, wheelName: 'Male Crown', nodeId: 15 },
  { id: 'release', term: 'Release', phonetic: '/rɪˈliːs/', grade: 4, rate: '+', definition: 'The act of setting someone or something free.', wheel: 7, wheelName: 'Male Crown', nodeId: 16 },
  // Wheel 8 — Female Crown
  { id: 'infinity', term: 'Infinity', phonetic: '/ɪnˈfɪn.ɪ.ti/', grade: 3, rate: '~', definition: 'The state of being infinite.', wheel: 8, wheelName: 'Female Crown', nodeId: 1 },
  { id: 'weaving_love', term: 'Weaving love', phonetic: '/ˈwiːv.ɪŋ lʌv/', grade: 4, rate: '+', definition: 'The act of creating love through interlacing.', wheel: 8, wheelName: 'Female Crown', nodeId: 2 },
  { id: 'vibrating', term: 'Vibrating', phonetic: '/vaɪˈbreɪt.ɪŋ/', grade: 4, rate: '+', definition: 'Moving continuously and rapidly to and fro.', wheel: 8, wheelName: 'Female Crown', nodeId: 3 },
  { id: 'core_centring', term: 'Core centring', phonetic: "/kɔːr ˈsɛnt.ər.ɪŋ/", grade: 4, rate: '+', definition: "The act of focusing on one's central or most important part.", wheel: 8, wheelName: 'Female Crown', nodeId: 4 },
  { id: 'purification', term: 'Purification', phonetic: '/ˌpjʊər.ɪ.fɪˈkeɪ.ʃən/', grade: 4, rate: '+', definition: 'The act of making something pure.', wheel: 8, wheelName: 'Female Crown', nodeId: 5 },
  { id: 'stability', term: 'Stability', phonetic: '/stəˈbɪl.ɪ.ti/', grade: 4, rate: '+', definition: 'The state of being stable.', wheel: 8, wheelName: 'Female Crown', nodeId: 6 },
  { id: 'kindness', term: 'Kindness', phonetic: '/ˈkaɪnd.nəs/', grade: 5, rate: '+', definition: 'The quality of being friendly, generous, and considerate.', wheel: 8, wheelName: 'Female Crown', nodeId: 7 },
  { id: 'transformation', term: 'Transformation', phonetic: '/ˌtræns.fɔːˈmeɪ.ʃən/', grade: 5, rate: '+', definition: 'A thorough or dramatic change in form or appearance.', wheel: 8, wheelName: 'Female Crown', nodeId: 8 },
  { id: 'self_love', term: 'Self love', phonetic: '/sɛlf lʌv/', grade: 5, rate: '+', definition: "Regard for one's own well-being and happiness.", wheel: 8, wheelName: 'Female Crown', nodeId: 9 },
  { id: 'pure_being', term: 'Pure being', phonetic: "/pjʊər ˈbiː.ɪŋ/", grade: 5, rate: '+', definition: 'The state of existing in a pure and untainted form.', wheel: 8, wheelName: 'Female Crown', nodeId: 10 },
  { id: 'limitlessness', term: 'Limitlessness', phonetic: '/ˈlɪm.ɪt.ləs.nəs/', grade: 3, rate: '~', definition: 'The state of having no limits.', wheel: 8, wheelName: 'Female Crown', nodeId: 11 },
  { id: 'contingency', term: 'Contingency', phonetic: '/kənˈtɪn.dʒən.si/', grade: 3, rate: '~', definition: 'A future event or circumstance that is possible but cannot be predicted.', wheel: 8, wheelName: 'Female Crown', nodeId: 12 },
  { id: 'sensual', term: 'Sensual', phonetic: '/ˈsɛn.ʃu.əl/', grade: 4, rate: '+', definition: 'Relating to or involving gratification of the senses.', wheel: 8, wheelName: 'Female Crown', nodeId: 13 },
  { id: 'effort', term: 'Effort', phonetic: '/ˈɛf.ərt/', grade: 3, rate: '~', definition: 'A vigorous or determined attempt.', wheel: 8, wheelName: 'Female Crown', nodeId: 14 },
  { id: 'innovating', term: 'Innovating', phonetic: '/ˈɪn.ə.veɪt.ɪŋ/', grade: 4, rate: '+', definition: 'The act of introducing new ideas or methods.', wheel: 8, wheelName: 'Female Crown', nodeId: 15 },
  { id: 'heritage', term: 'Heritage', phonetic: '/ˈhɛr.ɪ.tɪdʒ/', grade: 4, rate: '+', definition: 'Property that is or may be inherited.', wheel: 8, wheelName: 'Female Crown', nodeId: 16 },
  // Wheel 9 — Etheral Heart
  { id: 'father', term: 'Father', phonetic: '/ˈfɑː.ðər/', grade: 3, rate: '~', definition: 'A male parent.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 1 },
  { id: 'son', term: 'Son', phonetic: '/sʌn/', grade: 3, rate: '~', definition: 'A male child in relation to his parents.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 2 },
  { id: 'spirit', term: 'Spirit', phonetic: '/ˈspɪr.ɪt/', grade: 3, rate: '~', definition: 'The non-physical part of a person regarded as their true self.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 3 },
  { id: 'brother', term: 'Brother', phonetic: '/ˈbrʌð.ər/', grade: 3, rate: '~', definition: 'A male sibling.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 4 },
  { id: 'mother', term: 'Mother', phonetic: '/ˈmʌð.ər/', grade: 3, rate: '~', definition: 'A female parent.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 5 },
  { id: 'daughter', term: 'Daughter', phonetic: '/ˈdɔː.tər/', grade: 3, rate: '~', definition: 'A female child in relation to her parents.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 6 },
  { id: 'sister', term: 'Sister', phonetic: '/ˈsɪs.tər/', grade: 3, rate: '~', definition: 'A female sibling.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 7 },
  { id: 'source', term: 'Source', phonetic: '/sɔːrs/', grade: 3, rate: '~', definition: 'A place, person, or thing from which something originates.', wheel: 9, wheelName: 'Etheral Heart', nodeId: 8 },
]
