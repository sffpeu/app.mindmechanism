export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

export const words: Word[] = [
  {
    word: 'Achievement',
    phonetic: '/əˈtʃiːvmənt/',
    definition: 'A successful result gained through effort.',
    rating: 5,
    type: 'Positive'
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
    word: 'Aim',
    phonetic: '/eɪm/',
    definition: 'A purpose or intention.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Rebirth',
    phonetic: '/riːˈbɜːrθ/',
    definition: 'The process of being born again.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Exuberance',
    phonetic: '/ɪɡˈzjuːbərəns/',
    definition: 'The quality of being full of energy and excitement.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Urge',
    phonetic: '/ɜːrdʒ/',
    definition: 'A strong desire or impulse.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Balancing',
    phonetic: '/ˈbælənsɪŋ/',
    definition: 'The act of keeping or putting something in a steady position.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Submerging',
    phonetic: '/səbˈmɜːrdʒɪŋ/',
    definition: 'The act of sinking below the surface.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Attracting',
    phonetic: '/əˈtræktɪŋ/',
    definition: 'The act of drawing attention or interest.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Curiosity',
    phonetic: '/ˌkjʊriˈɒsɪti/',
    definition: 'A strong desire to know or learn something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Colliding',
    phonetic: '/kəˈlaɪdɪŋ/',
    definition: 'The act of coming into conflict or striking together.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Concern',
    phonetic: '/kənˈsɜːrn/',
    definition: 'A matter of interest or importance.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Fate',
    phonetic: '/feɪt/',
    definition: 'The development of events beyond a person's control.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Overbearing',
    phonetic: '/ˌoʊvərˈbɛrɪŋ/',
    definition: 'Unpleasantly or arrogantly domineering.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Life force',
    phonetic: '/laɪf fɔːrs/',
    definition: 'The energy that gives life to living beings.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Protecting',
    phonetic: '/prəˈtɛktɪŋ/',
    definition: 'The act of keeping someone or something safe.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Triumphing',
    phonetic: '/ˈtraɪəmfɪŋ/',
    definition: 'Achieving a victory or success.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Preening',
    phonetic: '/ˈpriːnɪŋ/',
    definition: 'The act of making oneself look attractive.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Resonating',
    phonetic: '/ˈrɛzəˌneɪtɪŋ/',
    definition: 'Producing or being filled with a deep, full sound.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Immersing',
    phonetic: '/ɪˈmɜːrsɪŋ/',
    definition: 'The act of deeply involving oneself in an activity.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Righteous',
    phonetic: '/ˈraɪtʃəs/',
    definition: 'Morally right or justifiable.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Compulsion',
    phonetic: '/kəmˈpʌlʃən/',
    definition: 'The action or state of forcing or being forced to do something.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Yearning',
    phonetic: '/ˈjɜːrnɪŋ/',
    definition: 'A feeling of intense longing for something.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Adapting',
    phonetic: '/əˈdæptɪŋ/',
    definition: 'The act of making something suitable for a new use or purpose.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Fostering',
    phonetic: '/ˈfɒstərɪŋ/',
    definition: 'Encouraging the development of something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Flaunting',
    phonetic: '/ˈflɔːntɪŋ/',
    definition: 'Displaying something ostentatiously.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Advocating',
    phonetic: '/ˈædvəˌkeɪtɪŋ/',
    definition: 'Publicly recommending or supporting something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Beguiling',
    phonetic: '/bɪˈɡaɪlɪŋ/',
    definition: 'Charming or enchanting, often in a deceptive way.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Crippling',
    phonetic: '/ˈkrɪplɪŋ/',
    definition: 'Causing severe damage or harm.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Repairing',
    phonetic: '/rɪˈpɛrɪŋ/',
    definition: 'The act of fixing or mending something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Transforming',
    phonetic: '/trænsˈfɔːrmɪŋ/',
    definition: 'Making a thorough or dramatic change.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Suspension',
    phonetic: '/səˈspɛnʃən/',
    definition: 'The temporary prevention of something.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Replanting',
    phonetic: '/riˈplæntɪŋ/',
    definition: 'The act of planting something again.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Reprocessing',
    phonetic: '/riˈprɑːsɛsɪŋ/',
    definition: 'The act of processing something again.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Child-like',
    phonetic: '/tʃaɪld laɪk/',
    definition: 'Having qualities associated with a child.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Unveiling',
    phonetic: '/ˌʌnˈveɪlɪŋ/',
    definition: 'The act of revealing something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Flight',
    phonetic: '/flaɪt/',
    definition: 'The act of flying or moving through the air.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Premonition',
    phonetic: '/ˌprɛməˈnɪʃən/',
    definition: 'A strong feeling that something is about to happen.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Seeking',
    phonetic: '/ˈsiːkɪŋ/',
    definition: 'The act of looking for or trying to find something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Idealism',
    phonetic: '/aɪˈdiːəlɪzəm/',
    definition: 'The practice of forming or pursuing ideals.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Surrendering',
    phonetic: '/səˈrɛndərɪŋ/',
    definition: 'The act of giving up or yielding.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Bliss',
    phonetic: '/blɪs/',
    definition: 'Perfect happiness or joy.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Spontaneity',
    phonetic: '/ˌspɒntəˈneɪɪti/',
    definition: 'The quality of being spontaneous.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Discourse',
    phonetic: '/ˈdɪskɔːrs/',
    definition: 'Written or spoken communication or debate.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Empathy',
    phonetic: '/ˈɛmpəθi/',
    definition: 'The ability to understand and share the feelings of another.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Righteousness',
    phonetic: '/ˈraɪtʃəsnəs/',
    definition: 'The quality of being morally right or justifiable.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Prayer',
    phonetic: '/prɛr/',
    definition: 'A solemn request for help or expression of thanks addressed to God.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Majesty',
    phonetic: '/ˈmædʒəsti/',
    definition: 'Impressive beauty or scale.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Praise',
    phonetic: '/preɪz/',
    definition: 'The expression of approval or admiration.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Libation',
    phonetic: '/laɪˈbeɪʃən/',
    definition: 'A drink poured out as an offering to a deity.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Atonement',
    phonetic: '/əˈtoʊnmənt/',
    definition: 'The action of making amends for a wrong.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Ceremony',
    phonetic: '/ˈsɛrəˌmoʊni/',
    definition: 'A formal event held on a special occasion.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Temperance',
    phonetic: '/ˈtɛmpərəns/',
    definition: 'Moderation or self-restraint.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Release',
    phonetic: '/rɪˈliːs/',
    definition: 'The act of setting someone or something free.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Infinity',
    phonetic: '/ɪnˈfɪnɪti/',
    definition: 'The state of being infinite.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Weaving love',
    phonetic: '/ˈwiːvɪŋ lʌv/',
    definition: 'The act of creating love through interlacing.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Vibrating',
    phonetic: '/ˈvaɪbreɪtɪŋ/',
    definition: 'Moving continuously and rapidly to and fro.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Core centring',
    phonetic: '/kɔːr ˈsɛntərɪŋ/',
    definition: 'The act of focusing on one's central or most important part.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Purification',
    phonetic: '/ˌpjʊrɪfɪˈkeɪʃən/',
    definition: 'The act of making something pure.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Stability',
    phonetic: '/stəˈbɪlɪti/',
    definition: 'The state of being stable.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Kindness',
    phonetic: '/ˈkaɪndnəs/',
    definition: 'The quality of being friendly, generous, and considerate.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Transformation',
    phonetic: '/ˌtrænsfərˈmeɪʃən/',
    definition: 'A thorough or dramatic change in form or appearance.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Self love',
    phonetic: '/sɛlf lʌv/',
    definition: 'Regard for one\'s own well-being and happiness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Pure being',
    phonetic: '/pjʊr ˈbiːɪŋ/',
    definition: 'The state of existing in a pure and untainted form.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Limitlessness',
    phonetic: '/ˈlɪmɪtlɪsnəs/',
    definition: 'The state of having no limits.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Contingency',
    phonetic: '/kənˈtɪndʒənsi/',
    definition: 'A future event or circumstance that is possible but cannot be predicted with certainty.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Sensual',
    phonetic: '/ˈsɛnʃuəl/',
    definition: 'Relating to or involving gratification of the senses.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Effort',
    phonetic: '/ˈɛfərt/',
    definition: 'A vigorous or determined attempt.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Innovating',
    phonetic: '/ˈɪnəˌveɪtɪŋ/',
    definition: 'The act of introducing new ideas or methods.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Heritage',
    phonetic: '/ˈhɛrɪtɪdʒ/',
    definition: 'Property that is or may be inherited.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Father',
    phonetic: '/ˈfɑːðər/',
    definition: 'A male parent.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Son',
    phonetic: '/sʌn/',
    definition: 'A male child in relation to his parents.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Spirit',
    phonetic: '/ˈspɪrɪt/',
    definition: 'The non-physical part of a person regarded as their true self.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Brother',
    phonetic: '/ˈbrʌðər/',
    definition: 'A male sibling.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Mother',
    phonetic: '/ˈmʌðər/',
    definition: 'A female parent.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Daughter',
    phonetic: '/ˈdɔːtər/',
    definition: 'A female child in relation to her parents.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Sister',
    phonetic: '/ˈsɪstər/',
    definition: 'A female sibling.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Source',
    phonetic: '/sɔːrs/',
    definition: 'A place, person, or thing from which something originates.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'A cut above',
    phonetic: '/ə kʌt əˈbʌv/',
    definition: 'Significantly better than others.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Absolute',
    phonetic: '/ˈæbsəˌlut/',
    definition: 'Not qualified or diminished in any way; total.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Absurdity',
    phonetic: '/əbˈsɜːrdɪti/',
    definition: 'The quality or state of being ridiculous or wildly unreasonable.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Abuse',
    phonetic: '/əˈbjuːs/',
    definition: 'The improper use of something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Abusiveness',
    phonetic: '/əˈbjuːsɪvnəs/',
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
  }
];

export async function loadWords(): Promise<Word[]> {
  return words;
}

// Function to get words for a specific clock
export async function getClockWords(clockId: string): Promise<Word[]> {
  return words.filter((word: Word) => {
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

export async function getAllWords(): Promise<Word[]> {
  return words;
} 