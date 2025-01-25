export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

// Hardcoded words data
export const initialWords: Word[] = [
  {
    word: 'A cut above',
    phonetic: '/ə kʌt əˈbʌv/',
    definition: 'Significantly better than others.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Absolute',
    phonetic: '/æbsəluːt/',
    definition: 'Not qualified or diminished in any way',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Absurdity',
    phonetic: '/əbsɜːrdɪti/',
    definition: 'The quality or state of being ridiculous or wildly unreasonable.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Abuse',
    phonetic: '/əbjuːs/',
    definition: 'The improper use of something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Abusiveness',
    phonetic: '/əbjuːsɪvnəs/',
    definition: 'The bad quality of being abusive towards someone or something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Acceptance',
    phonetic: '/əkˈsɛptəns/',
    definition: 'The action of consenting to receive or undertake something offered.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Accurate',
    phonetic: '/ˈækjərɪt/',
    definition: 'Correct in all details; exact.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Adaptability',
    phonetic: '/əˌdæptəˈbɪlɪti/',
    definition: 'The quality of being able to adjust to new conditions.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Adequacy',
    phonetic: '/ˈædɪkwəsi/',
    definition: 'The state of being sufficient for the purpose concerned.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Advantage',
    phonetic: '/ədˈvæntɪdʒ/',
    definition: 'A condition or circumstance that puts one in a favorable or superior position.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Advocacy',
    phonetic: '/ˈædvəkəsi/',
    definition: 'Public support for or recommendation of a particular cause or policy.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Aggravation',
    phonetic: '/ˌæɡrəˈveɪʃən/',
    definition: 'The state of becoming worse or more serious.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Aggression',
    phonetic: '/əˈɡrɛʃən/',
    definition: 'Hostile or violent behavior or attitudes.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Agitation',
    phonetic: '/ˌædʒɪˈteɪʃən/',
    definition: 'A state of anxiety or nervous excitement.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Agony',
    phonetic: '/ˈæɡəni/',
    definition: 'Extreme physical or mental suffering.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Agoraphobia',
    phonetic: '/ˌæɡərəˈfoʊbiə/',
    definition: 'Extreme or irrational fear of open or public places.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Alarm',
    phonetic: '/əˈlɑrm/',
    definition: 'An anxious awareness of danger.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Alienation',
    phonetic: '/ˌeɪliəˈneɪʃən/',
    definition: 'The state or experience of being isolated from a group or an activity to which one should belong or in which one should be involved.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Animated',
    phonetic: '/ˈænɪˌmeɪtɪd/',
    definition: 'Full of life or excitement; lively.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Antagonism',
    phonetic: '/ænˈtæɡənɪzəm/',
    definition: 'Active hostility or opposition.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Anxiousness',
    phonetic: '/ˈæŋkʃəsnəs/',
    definition: 'The state of being anxious or worried.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Apathetic',
    phonetic: '/ˈæpəθi/',
    definition: 'Lack of interest, enthusiasm, or concern for feelings toward something or someone.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Apathy',
    phonetic: '/ˈæpəθi/',
    definition: 'Lack of interest, enthusiasm, or concern.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Appal',
    phonetic: '/əˈpɔːl/',
    definition: 'To greatly dismay or horrify.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Willingness',
    phonetic: '/ˈwɪlɪŋnəs/',
    definition: 'The quality of being prepared to do something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Vitality',
    phonetic: '/vaɪˈtælɪti/',
    definition: 'The state of being strong and active.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Frisky',
    phonetic: '/ˈfrɪski/',
    definition: 'Playful and full of energy.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Boldness',
    phonetic: '/ˈboʊldnəs/',
    definition: 'The quality of having a strong, vivid, or daring appearance.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Insight',
    phonetic: '/ˈɪnˌsaɪt/',
    definition: 'The capacity to gain an accurate and deep understanding.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Command',
    phonetic: '/kəˈmænd/',
    definition: 'The ability to use or control something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Reflection',
    phonetic: '/rɪˈflɛkʃən/',
    definition: 'Serious thought or consideration.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Illusion',
    phonetic: '/ɪˈluːʒən/',
    definition: 'A false idea or belief.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Union',
    phonetic: '/ˈjuːnjən/',
    definition: 'The action of joining together.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Sturdiness',
    phonetic: '/ˈstɜːdinəs/',
    definition: 'The quality of being strong and solid.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Insightful',
    phonetic: '/ɪnˈsaɪtfəl/',
    definition: 'Having or showing an accurate and deep understanding.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Modesty',
    phonetic: '/ˈmɒdɪsti/',
    definition: 'The quality of not being too proud or confident.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Surprise',
    phonetic: '/sərˈpraɪz/',
    definition: 'An unexpected or astonishing event.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Joyless',
    phonetic: '/ˈdʒɔɪləs/',
    definition: 'Lacking joy or happiness.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Rampant',
    phonetic: '/ˈræmpənt/',
    definition: 'Flourishing or spreading unchecked.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Causing',
    phonetic: '/ˈkɔːzɪŋ/',
    definition: 'The act of making something happen.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Salvage',
    phonetic: '/ˈsælvɪdʒ/',
    definition: 'The act of saving something from danger or destruction.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Roaring',
    phonetic: '/ˈrɔːrɪŋ/',
    definition: 'Making a loud, deep sound.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Pretentions',
    phonetic: '/prɪˈtɛnʃənz/',
    definition: 'Attempting to impress by affecting greater importance.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Salaciousness',
    phonetic: '/səˈleɪʃəsnəs/',
    definition: 'The quality of being obscene or indecent.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: "Aim",
    phonetic: "/eɪm/",
    definition: "A purpose or intention.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Rebirth",
    phonetic: "/riːˈbɜːrθ/",
    definition: "The process of being born again.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Exuberance",
    phonetic: "/ɪɡˈzjuːbərəns/",
    definition: "The quality of being full of energy and excitement.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Urge",
    phonetic: "/ɜːrdʒ/",
    definition: "A strong desire or impulse.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Balancing",
    phonetic: "/ˈbælənsɪŋ/",
    definition: "The act of keeping or putting something in a steady position.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Submerging",
    phonetic: "/səbˈmɜːrdʒɪŋ/",
    definition: "The act of sinking below the surface.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Attracting",
    phonetic: "/əˈtræktɪŋ/",
    definition: "The act of drawing attention or interest.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Curiosity",
    phonetic: "/ˌkjʊriˈɒsɪti/",
    definition: "A strong desire to know or learn something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Colliding",
    phonetic: "/kəˈlaɪdɪŋ/",
    definition: "The act of coming into conflict or striking together.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Concern",
    phonetic: "/kənˈsɜːrn/",
    definition: "A matter of interest or importance.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Fate",
    phonetic: "/feɪt/",
    definition: "The development of events beyond a person's control.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Overbearing",
    phonetic: "/ˌoʊvərˈbɛrɪŋ/",
    definition: "Unpleasantly or arrogantly domineering.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Life force",
    phonetic: "/laɪf fɔːrs/",
    definition: "The energy that gives life to living beings.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Protecting",
    phonetic: "/prəˈtɛktɪŋ/",
    definition: "The act of keeping someone or something safe.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Triumphing",
    phonetic: "/ˈtraɪəmfɪŋ/",
    definition: "Achieving a victory or success.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Preening",
    phonetic: "/ˈpriːnɪŋ/",
    definition: "The act of making oneself look attractive.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Resonating",
    phonetic: "/ˈrɛzəˌneɪtɪŋ/",
    definition: "Producing or being filled with a deep, full sound.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Immersing",
    phonetic: "/ɪˈmɜːrsɪŋ/",
    definition: "The act of deeply involving oneself in an activity.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Righteous",
    phonetic: "/ˈraɪtʃəs/",
    definition: "Morally right or justifiable.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Compulsion",
    phonetic: "/kəmˈpʌlʃən/",
    definition: "The action or state of forcing or being forced to do something.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Yearning",
    phonetic: "/ˈjɜːrnɪŋ/",
    definition: "A feeling of intense longing for something.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Fostering",
    phonetic: "/ˈfɒstərɪŋ/",
    definition: "Encouraging the development of something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Flaunting",
    phonetic: "/ˈflɔːntɪŋ/",
    definition: "Displaying something ostentatiously.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Advocating",
    phonetic: "/ˈædvəˌkeɪtɪŋ/",
    definition: "Publicly recommending or supporting something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Beguiling",
    phonetic: "/bɪˈɡaɪlɪŋ/",
    definition: "Charming or enchanting, often in a deceptive way.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Crippling",
    phonetic: "/ˈkrɪplɪŋ/",
    definition: "Causing severe damage or harm.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Repairing",
    phonetic: "/rɪˈpɛrɪŋ/",
    definition: "The act of fixing or mending something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Transforming",
    phonetic: "/trænsˈfɔːrmɪŋ/",
    definition: "Making a thorough or dramatic change.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Suspension",
    phonetic: "/səˈspɛnʃən/",
    definition: "The temporary prevention of something.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Replanting",
    phonetic: "/riˈplæntɪŋ/",
    definition: "The act of planting something again.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Reprocessing",
    phonetic: "/riˈprɑːsɛsɪŋ/",
    definition: "The act of processing something again.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Child-like",
    phonetic: "/tʃaɪld laɪk/",
    definition: "Having qualities associated with a child.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Unveiling",
    phonetic: "/ˌʌnˈveɪlɪŋ/",
    definition: "The act of revealing something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Flight",
    phonetic: "/flaɪt/",
    definition: "The act of flying or moving through the air.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Premonition",
    phonetic: "/ˌprɛməˈnɪʃən/",
    definition: "A strong feeling that something is about to happen.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Seeking",
    phonetic: "/ˈsiːkɪŋ/",
    definition: "The act of looking for or trying to find something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Idealism",
    phonetic: "/aɪˈdiːəlɪzəm/",
    definition: "The practice of forming or pursuing ideals.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Surrendering",
    phonetic: "/səˈrɛndərɪŋ/",
    definition: "The act of giving up or yielding.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Bliss",
    phonetic: "/blɪs/",
    definition: "Perfect happiness or joy.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Spontaneity",
    phonetic: "/ˌspɒntəˈneɪɪti/",
    definition: "The quality of being spontaneous.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Discourse",
    phonetic: "/ˈdɪskɔːrs/",
    definition: "Written or spoken communication or debate.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Empathy",
    phonetic: "/ˈɛmpəθi/",
    definition: "The ability to understand and share the feelings of another.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Righteousness",
    phonetic: "/ˈraɪtʃəsnəs/",
    definition: "The quality of being morally right or justifiable.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Prayer",
    phonetic: "/prɛr/",
    definition: "A solemn request for help or expression of thanks addressed to God.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Majesty",
    phonetic: "/ˈmædʒəsti/",
    definition: "Impressive beauty or scale.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Praise",
    phonetic: "/preɪz/",
    definition: "The expression of approval or admiration.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Libation",
    phonetic: "/laɪˈbeɪʃən/",
    definition: "A drink poured out as an offering to a deity.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Atonement",
    phonetic: "/əˈtoʊnmənt/",
    definition: "The action of making amends for a wrong.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Ceremony",
    phonetic: "/ˈsɛrəˌmoʊni/",
    definition: "A formal event held on a special occasion.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Temperance",
    phonetic: "/ˈtɛmpərəns/",
    definition: "Moderation or self-restraint.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Release",
    phonetic: "/rɪˈliːs/",
    definition: "The act of setting someone or something free.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Infinity",
    phonetic: "/ɪnˈfɪnɪti/",
    definition: "The state of being infinite.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Weaving love",
    phonetic: "/ˈwiːvɪŋ lʌv/",
    definition: "The act of creating love through interlacing.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Vibrating",
    phonetic: "/ˈvaɪbreɪtɪŋ/",
    definition: "Moving continuously and rapidly to and fro.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Core centring",
    phonetic: "/kɔːr ˈsɛntərɪŋ/",
    definition: "The act of focusing on one's central or most important part.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Purification",
    phonetic: "/ˌpjʊrɪfɪˈkeɪʃən/",
    definition: "The act of making something pure.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Stability",
    phonetic: "/stəˈbɪlɪti/",
    definition: "The state of being stable.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Kindness",
    phonetic: "/ˈkaɪndnəs/",
    definition: "The quality of being friendly, generous, and considerate.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Transformation",
    phonetic: "/ˌtrænsfərˈmeɪʃən/",
    definition: "A thorough or dramatic change in form or appearance.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Self love",
    phonetic: "/sɛlf lʌv/",
    definition: "Regard for one's own well-being and happiness.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Pure being",
    phonetic: "/pjʊr ˈbiːɪŋ/",
    definition: "The state of existing in a pure and untainted form.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Limitlessness",
    phonetic: "/ˈlɪmɪtlɪsnəs/",
    definition: "The state of having no limits.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Contingency",
    phonetic: "/kənˈtɪndʒənsi/",
    definition: "A future event or circumstance that is possible but cannot be predicted with certainty.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Sensual",
    phonetic: "/ˈsɛnʃuəl/",
    definition: "Relating to or involving gratification of the senses.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Effort",
    phonetic: "/ˈɛfərt/",
    definition: "A vigorous or determined attempt.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Innovating",
    phonetic: "/ˈɪnəˌveɪtɪŋ/",
    definition: "The act of introducing new ideas or methods.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Heritage",
    phonetic: "/ˈhɛrɪtɪdʒ/",
    definition: "Property that is or may be inherited.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Father",
    phonetic: "/ˈfɑːðər/",
    definition: "A male parent.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Son",
    phonetic: "/sʌn/",
    definition: "A male child in relation to his parents.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Spirit",
    phonetic: "/ˈspɪrɪt/",
    definition: "The non-physical part of a person regarded as their true self.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Brother",
    phonetic: "/ˈbrʌðər/",
    definition: "A male sibling.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Mother",
    phonetic: "/ˈmʌðər/",
    definition: "A female parent.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Daughter",
    phonetic: "/ˈdɔːtər/",
    definition: "A female child in relation to her parents.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Sister",
    phonetic: "/ˈsɪstər/",
    definition: "A female sibling.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Source",
    phonetic: "/sɔːrs/",
    definition: "A place, person, or thing from which something originates.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Absolute",
    phonetic: "/ˈæbsəˌlut/",
    definition: "Not qualified or diminished in any way; total.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Absurdity",
    phonetic: "/əbˈsɜːrdɪti/",
    definition: "The quality or state of being ridiculous or wildly unreasonable.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Abuse",
    phonetic: "/əˈbjuːs/",
    definition: "The improper use of something.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Apprehension",
    phonetic: "/ˌæprɪˈhɛnʃən/",
    definition: "Anxiety or fear that something bad or unpleasant will happen.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Approval",
    phonetic: "/əˈpruvəl/",
    definition: "The belief that someone or something is good or acceptable.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Argumentativeness",
    phonetic: "/ˌɑrɡjəˈmɛntətɪvnəs/",
    definition: "The quality of being prone to argue.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Assuredness",
    phonetic: "/əˈʃʊrdnəs/",
    definition: "Confidence in oneself or one's abilities.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Astonishment",
    phonetic: "/əˈstɑnɪʃmənt/",
    definition: "Great surprise.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Astoundedment",
    phonetic: "/əˈstaʊndɪdmənt/",
    definition: "The state of being greatly surprised or amazed.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "At ease",
    phonetic: "/æt iz/",
    definition: "Feeling relaxed and comfortable.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Atrociousness",
    phonetic: "/əˈtroʊʃəsnəs/",
    definition: "The quality of being shockingly bad or wicked.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Authentic",
    phonetic: "/ɔˈθɛntɪk/",
    definition: "Of undisputed origin; genuine.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Authenticity",
    phonetic: "/ˌɔːθɛnˈtɪsɪti/",
    definition: "The quality of being authentic or genuine.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Authoritative",
    phonetic: "/əˈθɔrɪˌteɪtɪv/",
    definition: "Commanding and self-confident; likely to be respected and obeyed.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Awareness",
    phonetic: "/əˈwɛrnəs/",
    definition: "Knowledge or perception of a situation or fact.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Awkwardness",
    phonetic: "/ˈɔkwərdnəs/",
    definition: "The quality of being clumsy or uncomfortable.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Balanced",
    phonetic: "/ˈbælənst/",
    definition: "Being in a state of equilibrium.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Bargaining",
    phonetic: "/ˈbɑrɡənɪŋ/",
    definition: "The negotiation of the terms and conditions of a transaction.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Beaming",
    phonetic: "/ˈbimɪŋ/",
    definition: "Smiling broadly; radiating happiness.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Being",
    phonetic: "/ˈbiːɪŋ/",
    definition: "Existence.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Blacklisted",
    phonetic: "/ˈblæklɪstɪd/",
    definition: "Being put on a list of people or things regarded as unacceptable or untrustworthy.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Blemished",
    phonetic: "/ˈblɛmɪʃt/",
    definition: "Having a mark or flaw that spoils the appearance of something.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Blessed",
    phonetic: "/blɛst/",
    definition: "Made holy; consecrated.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Blessing",
    phonetic: "/ˈblɛsɪŋ/",
    definition: "God's favor and protection.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Blissfulness",
    phonetic: "/ˈblɪsfəlnəs/",
    definition: "The state of being extremely happy.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Blushing",
    phonetic: "/ˈblʌʃɪŋ/",
    definition: "Developing a pink tinge in the face from embarrassment or shame.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Brave",
    phonetic: "/breɪv/",
    definition: "Ready to face and endure danger or pain; showing courage.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Brightness",
    phonetic: "/ˈbraɪtnəs/",
    definition: "The quality or state of giving out or reflecting light.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Brilliance",
    phonetic: "/ˈbrɪljəns/",
    definition: "Exceptional talent or intelligence.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Calm",
    phonetic: "/kɑm/",
    definition: "Not showing or feeling nervousness, anger, or other strong emotions.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Carefreeness",
    phonetic: "/ˈkɛrˌfrinəs/",
    definition: "The state of being free from anxiety or responsibility.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Causality",
    phonetic: "/kɔˈzælɪti/",
    definition: "The relationship between cause and effect.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Caution",
    phonetic: "/ˈkɔːʃən/",
    definition: "Care taken to avoid danger or mistakes.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Censorship",
    phonetic: "/ˈsɛnsərˌʃɪp/",
    definition: "The suppression or prohibition of any parts of books, films, news, etc. that are considered obscene, politically unacceptable, or a threat to security.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Centred",
    phonetic: "/ˈsɛntərd/",
    definition: "Placed or situated in the center.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Certainty",
    phonetic: "/ˈsɜrtnti/",
    definition: "Firm conviction that something is the case.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Cheerfulness",
    phonetic: "/ˈtʃɪrflnəs/",
    definition: "The quality or state of being noticeably happy and optimistic.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Clarity",
    phonetic: "/ˈklærɪti/",
    definition: "The quality of being clear, in particular.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Claustrophobia",
    phonetic: "/ˌklɔːstrəˈfoʊbiə/",
    definition: "Extreme or irrational fear of confined places.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Coercion",
    phonetic: "/koʊˈɜːrʒən/",
    definition: "The practice of persuading someone to do something by using force or threats.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Collision",
    phonetic: "/kəˈlɪʒən/",
    definition: "An instance of one moving object or person striking violently against another.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Comfort",
    phonetic: "/ˈkʌmfərt/",
    definition: "A state of physical ease and freedom from pain or constraint.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Comfortability",
    phonetic: "/ˌkʌmfərtəˈbɪlɪti/",
    definition: "The quality of being comfortable.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Compulsiveness",
    phonetic: "/kəmˈpʌlsɪvnəs/",
    definition: "The quality of being driven by an irresistible urge.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Condemning",
    phonetic: "/kənˈdɛmɪŋ/",
    definition: "Expressing complete disapproval of something.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Condescendence",
    phonetic: "/ˌkɒndɪˈsɛndəns/",
    definition: "An attitude of patronizing superiority.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Confidence",
    phonetic: "/ˈkɒnfɪdəns/",
    definition: "The feeling or belief that one can rely on someone or something; firm trust.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Confiding",
    phonetic: "/kənˈfaɪdɪŋ/",
    definition: "Trusting someone enough to tell them secrets or private matters.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Conscientiousness",
    phonetic: "/ˌkɒnʃiˈɛnʃəsnəs/",
    definition: "The quality of wishing to do one's work or duty well and thoroughly.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Constructivism",
    phonetic: "/kənˈstrʌktɪˌvɪzəm/",
    definition: "A philosophy of learning based on the premise that people construct their own understanding and knowledge of the world through experiences and reflecting on those experiences.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Contentment",
    phonetic: "/kənˈtɛntmənt/",
    definition: "A state of happiness and satisfaction.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Contrariness",
    phonetic: "/kənˈtrɛrɪnəs/",
    definition: "The quality of being contrary or perverse.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Controlling",
    phonetic: "/kənˈtroʊlɪŋ/",
    definition: "Exercising control over something or someone.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Controversial",
    phonetic: "/ˌkɒntrəˈvɜrʃəl/",
    definition: "Giving rise or likely to give rise to public disagreement.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Convenience",
    phonetic: "/kənˈvinjəns/",
    definition: "The state of being able to proceed with something with little effort or difficulty.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Conversion",
    phonetic: "/kənˈvɜrʒən/",
    definition: "The process of changing or causing something to change from one form to another.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Cooperation",
    phonetic: "/koʊˌɒpəˈreɪʃən/",
    definition: "The process of working together to the same end.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Cooperativeness",
    phonetic: "/koʊˈɒpərətɪvnəs/",
    definition: "The quality of being willing to work together.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Core cantering",
    phonetic: "/kɔr ˈkæntərɪŋ/",
    definition: "Focusing on the central or most important part.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Corruption",
    phonetic: "/kəˈrʌpʃən/",
    definition: "Dishonest or fraudulent conduct by those in power, typically involving bribery.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Courageousness",
    phonetic: "/kəˈreɪdʒəsnəs/",
    definition: "The quality of being brave.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Cover-up",
    phonetic: "/ˈkʌvərˌʌp/",
    definition: "An attempt to prevent people from discovering the truth about a serious mistake or crime.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Cowardliness",
    phonetic: "/ˈkaʊərdlɪnəs/",
    definition: "Lack of bravery.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Craving",
    phonetic: "/ˈkreɪvɪŋ/",
    definition: "A powerful desire for something.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Creativity",
    phonetic: "/ˌkriːeɪˈtɪvɪti/",
    definition: "The use of imagination or original ideas to create something.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Criticality",
    phonetic: "/ˌkrɪtɪˈkælɪti/",
    definition: "The quality of being critical, especially in a negative sense.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Damage",
    phonetic: "/ˈdæmɪdʒ/",
    definition: "Physical harm caused to something.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Daring",
    phonetic: "/ˈdɛərɪŋ/",
    definition: "Adventurous or audaciously bold.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Deadline",
    phonetic: "/ˈdɛdˌlaɪn/",
    definition: "The latest time or date by which something should be completed.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Definite",
    phonetic: "/ˈdɛfɪnɪt/",
    definition: "Clearly stated or decided; not vague or doubtful.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Delightfulness",
    phonetic: "/dɪˈlaɪtfəlnəs/",
    definition: "The quality of being delightful.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Deplorability",
    phonetic: "/dɪˌplɔːrəˈbɪlɪti/",
    definition: "The quality of being deserving strong condemnation.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Despair",
    phonetic: "/dɪˈspɛər/",
    definition: "The complete loss or absence of hope.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Devastation",
    phonetic: "/ˌdɛvəˈsteɪʃən/",
    definition: "Great destruction or damage.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Disadvantage",
    phonetic: "/ˌdɪsədˈvæntɪdʒ/",
    definition: "An unfavorable circumstance or condition that reduces the chances of success or effectiveness.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Disappointment",
    phonetic: "/ˌdɪsəˈpɔɪntmənt/",
    definition: "Sadness or displeasure caused by the non-fulfillment of one's hopes or expectations.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Disastrousness",
    phonetic: "/dɪˈzæstrəsnəs/",
    definition: "The quality of being disastrous.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Discounting",
    phonetic: "/dɪsˈkaʊntɪŋ/",
    definition: "The action of reducing the price of something.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Disdain",
    phonetic: "/dɪsˈdeɪn/",
    definition: "The feeling that someone or something is unworthy of one's consideration or respect.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Disdainfulness",
    phonetic: "/dɪsˈdeɪnfəlnəs/",
    definition: "The quality of showing disdain.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Disgust",
    phonetic: "/dɪsˈɡʌst/",
    definition: "A strong feeling of dislike or disapproval.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Dishonesty",
    phonetic: "/dɪsˈɒnɪsti/",
    definition: "Deceitfulness shown in someone's character or behavior.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Disillusionment",
    phonetic: "/ˌdɪsɪˈluːʒənmənt/",
    definition: "A feeling of disappointment resulting from the discovery that something is not as good as one believed it to be.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Disorientation",
    phonetic: "/dɪsˌɔːriənˈteɪʃən/",
    definition: "The condition of having lost one's sense of direction.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Distraction",
    phonetic: "/dɪˈstrækʃən/",
    definition: "A thing that prevents someone from giving full attention to something else.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Distress",
    phonetic: "/dɪˈstrɛs/",
    definition: "Extreme anxiety, sorrow, or pain.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Distrustfulness",
    phonetic: "/dɪsˈtrʌstfʊlnəs/",
    definition: "The quality of being distrustful.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Doom",
    phonetic: "/duːm/",
    definition: "Death, destruction, or some other terrible fate.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Doubt",
    phonetic: "/daʊt/",
    definition: "A feeling of uncertainty or lack of conviction.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Dread",
    phonetic: "/drɛd/",
    definition: "Great fear or apprehension.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Dreadfulness",
    phonetic: "/ˈdrɛdfəlnəs/",
    definition: "The quality of being dreadful.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Duality",
    phonetic: "/djuˈælɪti/",
    definition: "The quality or condition of being dual.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Dynamics",
    phonetic: "/daɪˈnæmɪks/",
    definition: "The forces or properties that stimulate growth, development, or change within a system or process.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Eagerness",
    phonetic: "/ˈiːɡərnəs/",
    definition: "Enthusiasm to do or to have something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Earnestness",
    phonetic: "/ˈɜrnɪstnəs/",
    definition: "Sincere and intense conviction.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Ease",
    phonetic: "/iːz/",
    definition: "Absence of difficulty or effort.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Ecstatic",
    phonetic: "/ɪkˈstætɪk/",
    definition: "Feeling or expressing overwhelming happiness or joyful excitement.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Effective",
    phonetic: "/ɪˈfɛktɪv/",
    definition: "Successful in producing a desired or intended result.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Efficiency",
    phonetic: "/ɪˈfɪʃənsi/",
    definition: "The state or quality of being efficient.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Ego",
    phonetic: "/ˈiːɡoʊ/",
    definition: "A person's sense of self-esteem or self-importance.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Egotism",
    phonetic: "/ˈiːɡəˌtɪzəm/",
    definition: "The practice of talking and thinking about oneself excessively because of an undue sense of self-importance.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Elation",
    phonetic: "/ɪˈleɪʃən/",
    definition: "Great happiness and exhilaration.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Elimination",
    phonetic: "/ɪˌlɪmɪˈneɪʃən/",
    definition: "The complete removal or destruction of something.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Embarrassment",
    phonetic: "/ɪmˈbærəsmənt/",
    definition: "A feeling of self-consciousness, shame, or awkwardness.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Emphasis",
    phonetic: "/ˈɛmfəsɪs/",
    definition: "Special importance, value, or prominence given to something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Encouragement",
    phonetic: "/ɪnˈkɜrɪdʒmənt/",
    definition: "The action of giving someone support, confidence, or hope.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Endurance",
    phonetic: "/ɪnˈdjʊərəns/",
    definition: "The ability to endure an unpleasant or difficult process or situation without giving way.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Enigmatic",
    phonetic: "/ˌɛnɪɡˈmætɪk/",
    definition: "Difficult to interpret or understand; mysterious.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Enraged",
    phonetic: "/ɪnˈreɪdʒd/",
    definition: "Very angry; furious.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Enthusiasm",
    phonetic: "/ɪnˈθjuːziæzəm/",
    definition: "Intense and eager enjoyment, interest, or approval.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Envy",
    phonetic: "/ˈɛnvi/",
    definition: "A feeling of discontented or resentful longing aroused by someone else's possessions, qualities, or luck.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Euphoria",
    phonetic: "/juːˈfɔːriə/",
    definition: "A feeling or state of intense excitement and happiness.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Exasperation",
    phonetic: "/ɪɡˌzæspəˈreɪʃən/",
    definition: "A feeling of intense irritation or annoyance.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Excellence",
    phonetic: "/ˈɛksələns/",
    definition: "The quality of being outstanding or extremely good.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Exhilaration",
    phonetic: "/ɪɡˌzɪləˈreɪʃən/",
    definition: "A feeling of excitement, happiness, or elation.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Explosion",
    phonetic: "/ɪkˈsploʊʒən/",
    definition: "A violent and destructive shattering or blowing apart of something.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Extra",
    phonetic: "/ˈɛkstrə/",
    definition: "Added to an existing or usual amount or number.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Extreme",
    phonetic: "/ɪkˈstriːm/",
    definition: "Reaching a high or the highest degree; very great.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Family",
    phonetic: "/ˈfæmɪli/",
    definition: "A group consisting of parents and their children living together in a household.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Fatigue",
    phonetic: "/fəˈtiːɡ/",
    definition: "Extreme tiredness resulting from mental or physical exertion or illness.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Fear",
    phonetic: "/fɪər/",
    definition: "An unpleasant emotion caused by the belief that someone or something is dangerous, likely to cause pain, or a threat.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Festivity",
    phonetic: "/fɛˈstɪvɪti/",
    definition: "The celebration of something in a joyful and exuberant way.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Finery",
    phonetic: "/ˈfaɪnəri/",
    definition: "Expensive or ostentatious clothes or decoration.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Fluidity",
    phonetic: "/fluːˈɪdɪti/",
    definition: "The quality of being smooth and graceful.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Forbidden",
    phonetic: "/fərˈbɪdən/",
    definition: "Not allowed; banned.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Forgiving",
    phonetic: "/fərˈɡɪvɪŋ/",
    definition: "Ready and willing to forgive.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Fortune",
    phonetic: "/ˈfɔːrtʃən/",
    definition: "Chance or luck as an external, arbitrary force affecting human affairs.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Fraudulence",
    phonetic: "/ˈfrɔːdjʊləns/",
    definition: "The action or quality of cheating, lying, or deceiving someone.",
    rating: 1,
    type: "Negative"
  },
  {
    word: "Freedom",
    phonetic: "/ˈfriːdəm/",
    definition: "The power or right to act, speak, or think as one wants without hindrance or restraint.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Frenzied",
    phonetic: "/ˈfrɛnziːd/",
    definition: "Wildly excited or uncontrolled.",
    rating: 2,
    type: "Negative"
  },
  {
    word: "Frisky",
    phonetic: "/ˈfrɪski/",
    definition: "Playful and full of energy.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Fulfillment",
    phonetic: "/fʊlˈfɪlmənt/",
    definition: "The achievement of something desired, promised, or predicted.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Generosity",
    phonetic: "/ˌdʒɛnəˈrɒsɪti/",
    definition: "The quality of being kind and generous.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Gentleness",
    phonetic: "/ˈdʒɛntlnəs/",
    definition: "The quality of being kind, tender, or mild-mannered.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Gratitude",
    phonetic: "/ˈɡrætɪtjuːd/",
    definition: "The quality of being thankful; readiness to show appreciation for and to return kindness.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Growth",
    phonetic: "/ɡroʊθ/",
    definition: "The process of increasing in physical size, quantity, or importance.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Harmony",
    phonetic: "/ˈhɑːrməni/",
    definition: "The state of being in agreement or concord.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Healing",
    phonetic: "/ˈhiːlɪŋ/",
    definition: "The process of making or becoming sound or healthy again.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Hope",
    phonetic: "/hoʊp/",
    definition: "A feeling of expectation and desire for a certain thing to happen.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Humility",
    phonetic: "/hjuːˈmɪlɪti/",
    definition: "A modest or low view of one's own importance; humbleness.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Illumination",
    phonetic: "/ɪˌluːmɪˈneɪʃən/",
    definition: "The action of illuminating or state of being illuminated.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Imagination",
    phonetic: "/ɪˌmædʒɪˈneɪʃən/",
    definition: "The faculty or action of forming new ideas, or images or concepts of external objects not present to the senses.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Inspiration",
    phonetic: "/ˌɪnspɪˈreɪʃən/",
    definition: "The process of being mentally stimulated to do or feel something, especially to do something creative.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Integrity",
    phonetic: "/ɪnˈtɛɡrɪti/",
    definition: "The quality of being honest and having strong moral principles.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Intelligence",
    phonetic: "/ɪnˈtɛlɪdʒəns/",
    definition: "The ability to acquire and apply knowledge and skills.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Intuition",
    phonetic: "/ˌɪntjuˈɪʃən/",
    definition: "The ability to understand something immediately, without the need for conscious reasoning.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Joy",
    phonetic: "/dʒɔɪ/",
    definition: "A feeling of great pleasure and happiness.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Justice",
    phonetic: "/ˈdʒʌstɪs/",
    definition: "Just behavior or treatment; the quality of being fair and reasonable.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Kindness",
    phonetic: "/ˈkaɪndnəs/",
    definition: "The quality of being friendly, generous, and considerate.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Knowledge",
    phonetic: "/ˈnɒlɪdʒ/",
    definition: "Facts, information, and skills acquired through experience or education.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Leadership",
    phonetic: "/ˈliːdəʃɪp/",
    definition: "The action of leading a group of people or an organization.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Learning",
    phonetic: "/ˈlɜːnɪŋ/",
    definition: "The acquisition of knowledge or skills through study, experience, or being taught.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Love",
    phonetic: "/lʌv/",
    definition: "An intense feeling of deep affection.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Loyalty",
    phonetic: "/ˈlɔɪəlti/",
    definition: "The quality of being faithful to someone or something.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Mastery",
    phonetic: "/ˈmæstəri/",
    definition: "Comprehensive knowledge or skill in a subject or accomplishment.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Meditation",
    phonetic: "/ˌmɛdɪˈteɪʃən/",
    definition: "The practice of focusing one's mind for a period of time.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Mindfulness",
    phonetic: "/ˈmaɪndfʊlnəs/",
    definition: "The quality or state of being conscious or aware of something.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Motivation",
    phonetic: "/ˌmoʊtɪˈveɪʃən/",
    definition: "The reason or reasons one has for acting or behaving in a particular way.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Nurturing",
    phonetic: "/ˈnɜrtʃərɪŋ/",
    definition: "The process of caring for and encouraging the growth or development of someone or something.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Openness",
    phonetic: "/ˈoʊpənnəs/",
    definition: "The quality of being honest and transparent in one's attitudes and feelings.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Optimism",
    phonetic: "/ˈɒptɪmɪzəm/",
    definition: "Hopefulness and confidence about the future or the successful outcome of something.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Passion",
    phonetic: "/ˈpæʃən/",
    definition: "Strong and barely controllable emotion; intense enthusiasm for something.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Patience",
    phonetic: "/ˈpeɪʃəns/",
    definition: "The capacity to accept or tolerate delay, trouble, or suffering without getting angry or upset.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Peace",
    phonetic: "/piːs/",
    definition: "Freedom from disturbance; tranquility.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Perseverance",
    phonetic: "/ˌpɜrsəˈvɪrəns/",
    definition: "Persistence in doing something despite difficulty or delay in achieving success.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Perspective",
    phonetic: "/pərˈspɛktɪv/",
    definition: "A particular attitude toward or way of regarding something; a point of view.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Playfulness",
    phonetic: "/ˈpleɪfəlnəs/",
    definition: "The quality of being light-hearted or full of fun.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Pleasure",
    phonetic: "/ˈplɛʒər/",
    definition: "A feeling of happy satisfaction and enjoyment.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Power",
    phonetic: "/ˈpaʊər/",
    definition: "The ability or capacity to do something or act in a particular way.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Presence",
    phonetic: "/ˈprɛzəns/",
    definition: "The state or fact of existing, occurring, or being present.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Pride",
    phonetic: "/praɪd/",
    definition: "A feeling of deep pleasure or satisfaction derived from one's own achievements.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Purpose",
    phonetic: "/ˈpɜrpəs/",
    definition: "The reason for which something is done or created or for which something exists.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Radiance",
    phonetic: "/ˈreɪdiəns/",
    definition: "Light or heat as emitted or reflected by something.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Realization",
    phonetic: "/ˌriːəlaɪˈzeɪʃən/",
    definition: "The achievement of something desired or anticipated.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Receptivity",
    phonetic: "/ˌrɛsɛpˈtɪvɪti/",
    definition: "The quality of being willing, open, and able to receive and accept new ideas, impressions, or suggestions.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Recognition",
    phonetic: "/ˌrɛkəɡˈnɪʃən/",
    definition: "Acknowledgment of something's existence, validity, or legality.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Refinement",
    phonetic: "/rɪˈfaɪnmənt/",
    definition: "The process of removing impurities or unwanted elements from a substance.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Reflection",
    phonetic: "/rɪˈflɛkʃən/",
    definition: "Serious thought or consideration.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Relaxation",
    phonetic: "/ˌriːlækˈseɪʃən/",
    definition: "The state of being free from tension and anxiety.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Reliability",
    phonetic: "/rɪˌlaɪəˈbɪlɪti/",
    definition: "The quality of being trustworthy or of performing consistently well.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Resilience",
    phonetic: "/rɪˈzɪliəns/",
    definition: "The capacity to recover quickly from difficulties; toughness.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Respect",
    phonetic: "/rɪˈspɛkt/",
    definition: "A feeling of deep admiration for someone or something elicited by their abilities, qualities, or achievements.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Responsibility",
    phonetic: "/rɪˌspɒnsəˈbɪlɪti/",
    definition: "The state or fact of having a duty to deal with something or of having control over someone.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Reverence",
    phonetic: "/ˈrɛvərəns/",
    definition: "Deep respect for someone or something.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Satisfaction",
    phonetic: "/ˌsætɪsˈfækʃən/",
    definition: "Fulfillment of one's wishes, expectations, or needs, or the pleasure derived from this.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Security",
    phonetic: "/sɪˈkjʊrɪti/",
    definition: "The state of being free from danger or threat.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Serenity",
    phonetic: "/səˈrɛnɪti/",
    definition: "The state of being calm, peaceful, and untroubled.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Service",
    phonetic: "/ˈsɜrvɪs/",
    definition: "The action of helping or doing work for someone.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Simplicity",
    phonetic: "/sɪmˈplɪsɪti/",
    definition: "The quality or condition of being easy to understand or do.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Sincerity",
    phonetic: "/sɪnˈsɛrɪti/",
    definition: "The quality of being free from pretense, deceit, or hypocrisy.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Solitude",
    phonetic: "/ˈsɒlɪtjuːd/",
    definition: "The state or situation of being alone.",
    rating: 3,
    type: "Neutral"
  },
  {
    word: "Spirituality",
    phonetic: "/ˌspɪrɪtʃuˈælɪti/",
    definition: "The quality of being concerned with the human spirit or soul as opposed to material or physical things.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Spontaneity",
    phonetic: "/ˌspɒntəˈneɪɪti/",
    definition: "The quality of being natural and unconstrained; performed or occurring as a result of a sudden impulse.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Stability",
    phonetic: "/stəˈbɪlɪti/",
    definition: "The state of being stable and not likely to change or fail.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Strength",
    phonetic: "/strɛŋθ/",
    definition: "The quality or state of being physically or mentally strong.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Success",
    phonetic: "/səkˈsɛs/",
    definition: "The accomplishment of an aim or purpose.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Support",
    phonetic: "/səˈpɔːrt/",
    definition: "The action of bearing all or part of the weight of something or someone or of giving assistance.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Sympathy",
    phonetic: "/ˈsɪmpəθi/",
    definition: "Feelings of pity and sorrow for someone else's misfortune.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Tenderness",
    phonetic: "/ˈtɛndərnəs/",
    definition: "Gentle and loving or kind behavior toward someone.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Thankfulness",
    phonetic: "/ˈθæŋkfʊlnəs/",
    definition: "The feeling or expression of gratitude.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Tolerance",
    phonetic: "/ˈtɒlərəns/",
    definition: "The ability or willingness to tolerate something, in particular the existence of opinions or behavior that one does not necessarily agree with.",
    rating: 4,
    type: "Positive"
  },
  {
    word: "Tranquility",
    phonetic: "/træŋˈkwɪlɪti/",
    definition: "The quality or state of being calm.",
    rating: 5,
    type: "Positive"
  },
  {
    word: "Trust",
    phonetic: "/trʌst/",
    definition: "Firm belief in the reliability, truth, ability, or strength of someone or something.",
    rating: 5,
    type: "Positive"
  }
];

export async function loadWords(): Promise<Word[]> {
  return initialWords;
}

// Function to get words for a specific clock
export function getClockWords(clockId: string): Word[] {
  return initialWords.filter(word => {
    const rating = Number(word.rating);
    if (clockId === "clock1") {
      return rating === 5;
    } else if (clockId === "clock2") {
      return rating === 3;
    } else if (clockId === "clock3") {
      return rating === 1;
    }
    return false;
  });
}

export function getAllWords(): Word[] {
  return initialWords;
} 