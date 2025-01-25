export interface Word {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

export const words: Word[] = [
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
    word: 'Apprehension',
    phonetic: '/ˌæprɪˈhɛnʃən/',
    definition: 'Anxiety or fear that something bad or unpleasant will happen.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Approval',
    phonetic: '/əˈpruvəl/',
    definition: 'The belief that someone or something is good or acceptable.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Argumentativeness',
    phonetic: '/ˌɑrɡjəˈmɛntətɪvnəs/',
    definition: 'The quality of being prone to argue.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Assuredness',
    phonetic: '/əˈʃʊrdnəs/',
    definition: 'Confidence in oneself or one\'s abilities.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Astonishment',
    phonetic: '/əˈstɑnɪʃmənt/',
    definition: 'Great surprise.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Astoundedment',
    phonetic: '/əˈstaʊndɪdmənt/',
    definition: 'The state of being greatly surprised or amazed.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'At ease',
    phonetic: '/æt iz/',
    definition: 'Feeling relaxed and comfortable.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Atrociousness',
    phonetic: '/əˈtroʊʃəsnəs/',
    definition: 'The quality of being shockingly bad or wicked.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Authentic',
    phonetic: '/ɔˈθɛntɪk/',
    definition: 'Of undisputed origin; genuine.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Authenticity',
    phonetic: '/ˌɔːθɛnˈtɪsɪti/',
    definition: 'The quality of being authentic or genuine.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Authoritative',
    phonetic: '/əˈθɔrɪˌteɪtɪv/',
    definition: 'Commanding and self-confident; likely to be respected and obeyed.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Awareness',
    phonetic: '/əˈwɛrnəs/',
    definition: 'Knowledge or perception of a situation or fact.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Awkwardness',
    phonetic: '/ˈɔkwərdnəs/',
    definition: 'The quality of being clumsy or uncomfortable.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Balance',
    phonetic: '/ˈbæləns/',
    definition: 'A state of equilibrium or equipoise; equal distribution of weight.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Beauty',
    phonetic: '/ˈbjuːti/',
    definition: 'A combination of qualities that pleases the aesthetic senses.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Belief',
    phonetic: '/bɪˈliːf/',
    definition: 'An acceptance that a statement or concept is true.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Belonging',
    phonetic: '/bɪˈlɔːŋɪŋ/',
    definition: 'The feeling of being comfortable and secure as part of something.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Benevolence',
    phonetic: '/bəˈnɛvələns/',
    definition: 'The quality of being well meaning; kindness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Betrayal',
    phonetic: '/bɪˈtreɪəl/',
    definition: 'The action of betraying one\'s trust or faith.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Bitterness',
    phonetic: '/ˈbɪtərnəs/',
    definition: 'Anger and disappointment at being treated unfairly.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Blame',
    phonetic: '/bleɪm/',
    definition: 'The attribution of fault or responsibility.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Blessing',
    phonetic: '/ˈblɛsɪŋ/',
    definition: 'God\'s favor and protection; a thing conducive to happiness or welfare.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Bliss',
    phonetic: '/blɪs/',
    definition: 'Perfect happiness; great joy.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Boldness',
    phonetic: '/ˈboʊldnəs/',
    definition: 'The quality of being confident and courageous.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Boredom',
    phonetic: '/ˈbɔːrdəm/',
    definition: 'The state of feeling weary and impatient.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Bravery',
    phonetic: '/ˈbreɪvəri/',
    definition: 'Courageous behavior or character.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Brightness',
    phonetic: '/ˈbraɪtnəs/',
    definition: 'The quality of being bright or radiant.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Brilliance',
    phonetic: '/ˈbrɪljəns/',
    definition: 'Exceptional talent or intelligence.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Burden',
    phonetic: '/ˈbɜrdən/',
    definition: 'A load, typically a heavy one; a cause of hardship or worry.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Calmness',
    phonetic: '/ˈkɑːmnəs/',
    definition: 'The state of being free from agitation or strong emotion.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Capability',
    phonetic: '/ˌkeɪpəˈbɪləti/',
    definition: 'The power or ability to do something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Care',
    phonetic: '/kɛr/',
    definition: 'The provision of what is necessary for health, welfare, maintenance, and protection.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Carelessness',
    phonetic: '/ˈkɛrlɪsnəs/',
    definition: 'Failure to give sufficient attention to avoiding harm or errors.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Certainty',
    phonetic: '/ˈsɜrtnti/',
    definition: 'Firm conviction that something is the case.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Challenge',
    phonetic: '/ˈtʃælɪndʒ/',
    definition: 'A task or situation that tests someone\'s abilities.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Chaos',
    phonetic: '/ˈkeɪɒs/',
    definition: 'Complete disorder and confusion.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Charity',
    phonetic: '/ˈtʃærɪti/',
    definition: 'The voluntary giving of help to those in need.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Charm',
    phonetic: '/tʃɑrm/',
    definition: 'The power or quality of delighting, attracting, or fascinating others.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Cheerfulness',
    phonetic: '/ˈtʃɪrfəlnəs/',
    definition: 'The quality of being noticeably happy and optimistic.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Clarity',
    phonetic: '/ˈklærɪti/',
    definition: 'The quality of being clear and easily understood.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Cleanliness',
    phonetic: '/ˈklɛnlinəs/',
    definition: 'The state or quality of being clean.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Cleverness',
    phonetic: '/ˈklɛvərnəs/',
    definition: 'The quality of being quick to understand and learn.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Clumsiness',
    phonetic: '/ˈklʌmzinəs/',
    definition: 'The quality of being awkward in movement or handling things.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Coercion',
    phonetic: '/koʊˈɜrʃən/',
    definition: 'The practice of persuading someone to do something by using force or threats.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Comfort',
    phonetic: '/ˈkʌmfərt/',
    definition: 'A state of physical ease and freedom from pain or constraint.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Commitment',
    phonetic: '/kəˈmɪtmənt/',
    definition: 'The state or quality of being dedicated to a cause or activity.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Compassion',
    phonetic: '/kəmˈpæʃən/',
    definition: 'Sympathetic concern for the sufferings or misfortunes of others.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Competence',
    phonetic: '/ˈkɒmpɪtəns/',
    definition: 'The ability to do something successfully or efficiently.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Complacency',
    phonetic: '/kəmˈpleɪsənsi/',
    definition: 'A feeling of smug or uncritical satisfaction with oneself or one\'s achievements.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Completeness',
    phonetic: '/kəmˈpliːtnəs/',
    definition: 'The state of having all the necessary or appropriate parts.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Complexity',
    phonetic: '/kəmˈplɛksɪti/',
    definition: 'The state of being intricate or complicated.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Composure',
    phonetic: '/kəmˈpoʊʒər/',
    definition: 'The state or feeling of being calm and in control of oneself.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Concentration',
    phonetic: '/ˌkɑnsənˈtreɪʃən/',
    definition: 'The action or power of focusing one\'s attention or mental effort.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Confidence',
    phonetic: '/ˈkɒnfɪdəns/',
    definition: 'The feeling or belief that one can rely on someone or something; firm trust.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Confusion',
    phonetic: '/kənˈfjuːʒən/',
    definition: 'Lack of understanding; uncertainty.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Connection',
    phonetic: '/kəˈnɛkʃən/',
    definition: 'A relationship in which a person, thing, or idea is linked or associated with something else.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Consciousness',
    phonetic: '/ˈkɒnʃəsnəs/',
    definition: 'The state of being aware of and responsive to one\'s surroundings.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Consideration',
    phonetic: '/kənˌsɪdəˈreɪʃən/',
    definition: 'Careful thought, typically over a period of time.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Consistency',
    phonetic: '/kənˈsɪstənsi/',
    definition: 'Conformity in the application of something; the quality of being consistent.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Contentment',
    phonetic: '/kənˈtɛntmənt/',
    definition: 'A state of happiness and satisfaction.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Control',
    phonetic: '/kənˈtroʊl/',
    definition: 'The power to influence or direct people\'s behavior or the course of events.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Conviction',
    phonetic: '/kənˈvɪkʃən/',
    definition: 'A firmly held belief or opinion.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Cooperation',
    phonetic: '/koʊˌɑpəˈreɪʃən/',
    definition: 'The process of working together to the same end.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Courage',
    phonetic: '/ˈkɜrɪdʒ/',
    definition: 'The ability to face danger, fear, or difficulties with confidence.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Courtesy',
    phonetic: '/ˈkɜrtəsi/',
    definition: 'The showing of politeness in one\'s attitude and behavior toward others.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Cowardice',
    phonetic: '/ˈkaʊərdɪs/',
    definition: 'Lack of bravery; the trait of lacking courage.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Creativity',
    phonetic: '/ˌkriːeɪˈtɪvɪti/',
    definition: 'The use of imagination or original ideas to create something.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Credibility',
    phonetic: '/ˌkrɛdəˈbɪlɪti/',
    definition: 'The quality of being trusted and believed in.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Crisis',
    phonetic: '/ˈkraɪsɪs/',
    definition: 'A time of intense difficulty or danger.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Criticism',
    phonetic: '/ˈkrɪtɪˌsɪzəm/',
    definition: 'The expression of disapproval based on perceived faults or mistakes.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Cruelty',
    phonetic: '/ˈkruːəlti/',
    definition: 'Behavior that causes physical or mental harm to others.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Curiosity',
    phonetic: '/ˌkjʊriˈɒsɪti/',
    definition: 'A strong desire to know or learn something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Cynicism',
    phonetic: '/ˈsɪnɪˌsɪzəm/',
    definition: 'An inclination to believe that people are motivated purely by self-interest.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Danger',
    phonetic: '/ˈdeɪndʒər/',
    definition: 'The possibility of suffering harm or injury.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Daring',
    phonetic: '/ˈdɛrɪŋ/',
    definition: 'Adventurous courage; boldness.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Darkness',
    phonetic: '/ˈdɑrknəs/',
    definition: 'The absence of light; gloom.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Deceit',
    phonetic: '/dɪˈsiːt/',
    definition: 'The action or practice of deceiving someone.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Dedication',
    phonetic: '/ˌdɛdɪˈkeɪʃən/',
    definition: 'The quality of being committed to a task or purpose.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Defeat',
    phonetic: '/dɪˈfiːt/',
    definition: 'The act of being overcome in a contest or battle.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Defiance',
    phonetic: '/dɪˈfaɪəns/',
    definition: 'Open resistance; bold disobedience.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Delight',
    phonetic: '/dɪˈlaɪt/',
    definition: 'Great pleasure or joy.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Dependability',
    phonetic: '/dɪˌpɛndəˈbɪləti/',
    definition: 'The quality of being trustworthy and reliable.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Depression',
    phonetic: '/dɪˈprɛʃən/',
    definition: 'Feelings of severe despondency and dejection.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Desire',
    phonetic: '/dɪˈzaɪər/',
    definition: 'A strong feeling of wanting something or wishing for something to happen.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Despair',
    phonetic: '/dɪˈspɛr/',
    definition: 'The complete loss or absence of hope.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Determination',
    phonetic: '/dɪˌtɜrmɪˈneɪʃən/',
    definition: 'Firmness of purpose; resoluteness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Devotion',
    phonetic: '/dɪˈvoʊʃən/',
    definition: 'Love, loyalty, or enthusiasm for a person or activity.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Dignity',
    phonetic: '/ˈdɪɡnəti/',
    definition: 'The state or quality of being worthy of honor or respect.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Diligence',
    phonetic: '/ˈdɪlɪdʒəns/',
    definition: 'Careful and persistent work or effort.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Disappointment',
    phonetic: '/ˌdɪsəˈpɔɪntmənt/',
    definition: 'Sadness or displeasure caused by unfulfilled hopes or expectations.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Disaster',
    phonetic: '/dɪˈzæstər/',
    definition: 'A sudden event causing great damage or loss.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Discipline',
    phonetic: '/ˈdɪsəplɪn/',
    definition: 'The practice of training people to obey rules or a code of behavior.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Discovery',
    phonetic: '/dɪˈskʌvəri/',
    definition: 'The action or process of finding something previously unknown.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Disgrace',
    phonetic: '/dɪsˈɡreɪs/',
    definition: 'Loss of reputation or respect as a result of a dishonorable action.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Disgust',
    phonetic: '/dɪsˈɡʌst/',
    definition: 'A feeling of revulsion or strong disapproval.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Dishonesty',
    phonetic: '/dɪsˈɒnəsti/',
    definition: 'Deceitfulness shown in someone\'s character or behavior.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Disillusionment',
    phonetic: '/ˌdɪsɪˈluːʒənmənt/',
    definition: 'A feeling of disappointment resulting from the discovery that something is not as good as one believed.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Disloyalty',
    phonetic: '/dɪsˈlɔɪəlti/',
    definition: 'The quality of being unfaithful to a person, country, or cause.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Disorder',
    phonetic: '/dɪsˈɔːrdər/',
    definition: 'A state of confusion or lack of organization.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Disrespect',
    phonetic: '/ˌdɪsrɪˈspɛkt/',
    definition: 'Lack of respect or courtesy.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Distraction',
    phonetic: '/dɪˈstrækʃən/',
    definition: 'A thing that prevents someone from concentrating on something else.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Distress',
    phonetic: '/dɪˈstrɛs/',
    definition: 'Extreme anxiety, sorrow, or pain.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Distrust',
    phonetic: '/dɪsˈtrʌst/',
    definition: 'The feeling that someone or something cannot be relied upon.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Diversity',
    phonetic: '/dɪˈvɜrsɪti/',
    definition: 'The state of being varied or different.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Divinity',
    phonetic: '/dɪˈvɪnɪti/',
    definition: 'The state or quality of being divine.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Doubt',
    phonetic: '/daʊt/',
    definition: 'A feeling of uncertainty or lack of conviction.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Drama',
    phonetic: '/ˈdrɑːmə/',
    definition: 'An exciting, emotional, or unexpected event or circumstance.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Dread',
    phonetic: '/drɛd/',
    definition: 'Great fear or apprehension.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Dream',
    phonetic: '/driːm/',
    definition: 'A cherished aspiration, ambition, or ideal.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Drive',
    phonetic: '/draɪv/',
    definition: 'An innate, biologically determined urge to attain a goal or satisfy a need.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Dullness',
    phonetic: '/ˈdʌlnəs/',
    definition: 'The state of being boring or lacking interest.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Duty',
    phonetic: '/ˈduːti/',
    definition: 'A moral or legal obligation; a responsibility.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Dynamism',
    phonetic: '/ˈdaɪnəˌmɪzəm/',
    definition: 'The quality of being characterized by vigorous activity and progress.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Eagerness',
    phonetic: '/ˈiːɡərnəs/',
    definition: 'The quality of being keen or enthusiastic.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Earnestness',
    phonetic: '/ˈɜrnɪstnəs/',
    definition: 'The quality of being serious and sincere.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Ease',
    phonetic: '/iːz/',
    definition: 'Absence of difficulty or effort.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Ecstasy',
    phonetic: '/ˈɛkstəsi/',
    definition: 'An overwhelming feeling of great happiness or joyful excitement.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Education',
    phonetic: '/ˌɛdʒuˈkeɪʃən/',
    definition: 'The process of receiving or giving systematic instruction.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Effectiveness',
    phonetic: '/ɪˈfɛktɪvnəs/',
    definition: 'The degree to which something is successful in producing a desired result.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Efficiency',
    phonetic: '/ɪˈfɪʃənsi/',
    definition: 'The state or quality of being efficient; competency in performance.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Ego',
    phonetic: '/ˈiːɡoʊ/',
    definition: 'A person\'s sense of self-esteem or self-importance.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Elation',
    phonetic: '/iˈleɪʃən/',
    definition: 'Great happiness and exhilaration.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Elegance',
    phonetic: '/ˈɛlɪɡəns/',
    definition: 'The quality of being graceful and stylish in appearance or manner.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Embarrassment',
    phonetic: '/ɪmˈbærəsmənt/',
    definition: 'A feeling of self-consciousness, shame, or awkwardness.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Empathy',
    phonetic: '/ˈɛmpəθi/',
    definition: 'The ability to understand and share the feelings of another.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Emptiness',
    phonetic: '/ˈɛmptinəs/',
    definition: 'The state of containing nothing; an unfilled space.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Enchantment',
    phonetic: '/ɪnˈtʃæntmənt/',
    definition: 'A feeling of great pleasure or delight.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Encouragement',
    phonetic: '/ɪnˈkɜrɪdʒmənt/',
    definition: 'The action of giving someone support, confidence, or hope.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Endurance',
    phonetic: '/ɪnˈdʊrəns/',
    definition: 'The ability to endure difficult circumstances.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Energy',
    phonetic: '/ˈɛnərdʒi/',
    definition: 'The strength and vitality required for sustained activity.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Enlightenment',
    phonetic: '/ɪnˈlaɪtnmənt/',
    definition: 'The state of having knowledge or understanding.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Enmity',
    phonetic: '/ˈɛnmɪti/',
    definition: 'A state or feeling of active opposition or hostility.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Enthusiasm',
    phonetic: '/ɪnˈθuːziæzəm/',
    definition: 'Intense and eager enjoyment, interest, or approval.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Envy',
    phonetic: '/ˈɛnvi/',
    definition: 'A feeling of discontented or resentful longing.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Equality',
    phonetic: '/iˈkwɒlɪti/',
    definition: 'The state of being equal, especially in status, rights, or opportunities.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Equanimity',
    phonetic: '/ˌɛkwəˈnɪmɪti/',
    definition: 'Mental calmness and composure in difficult situations.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Error',
    phonetic: '/ˈɛrər/',
    definition: 'A mistake or inaccuracy.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Euphoria',
    phonetic: '/juːˈfɔːriə/',
    definition: 'A feeling or state of intense excitement and happiness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Evil',
    phonetic: '/ˈiːvəl/',
    definition: 'Profound immorality and wickedness.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Excellence',
    phonetic: '/ˈɛksələns/',
    definition: 'The quality of being outstanding or extremely good.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Excitement',
    phonetic: '/ɪkˈsaɪtmənt/',
    definition: 'A feeling of great enthusiasm and eagerness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Exhaustion',
    phonetic: '/ɪɡˈzɔːstʃən/',
    definition: 'A state of extreme physical or mental fatigue.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Expectation',
    phonetic: '/ˌɛkspɛkˈteɪʃən/',
    definition: 'A strong belief that something will happen or be the case.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Experience',
    phonetic: '/ɪkˈspɪriəns/',
    definition: 'Practical contact with and observation of facts or events.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Expertise',
    phonetic: '/ˌɛkspɜrˈtiːz/',
    definition: 'Expert skill or knowledge in a particular field.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Exploration',
    phonetic: '/ˌɛkspləˈreɪʃən/',
    definition: 'The action of traveling in or through an unfamiliar area in order to learn about it.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Failure',
    phonetic: '/ˈfeɪljər/',
    definition: 'Lack of success in doing or achieving something.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Faith',
    phonetic: '/feɪθ/',
    definition: 'Complete trust or confidence in someone or something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Faithfulness',
    phonetic: '/ˈfeɪθfəlnəs/',
    definition: 'The quality of being loyal and devoted.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Fame',
    phonetic: '/feɪm/',
    definition: 'The state of being known or recognized by many people.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Family',
    phonetic: '/ˈfæmɪli/',
    definition: 'A group of people who are related to each other.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Fascination',
    phonetic: '/ˌfæsɪˈneɪʃən/',
    definition: 'The power to attract intense interest or attention.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Fatigue',
    phonetic: '/fəˈtiːɡ/',
    definition: 'Extreme tiredness resulting from mental or physical exertion.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Fear',
    phonetic: '/fɪr/',
    definition: 'An unpleasant emotion caused by the threat of danger, pain, or harm.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Fearlessness',
    phonetic: '/ˈfɪrlɪsnəs/',
    definition: 'The quality of being without fear; courage.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Feebleness',
    phonetic: '/ˈfiːbəlnəs/',
    definition: 'The quality of being weak or lacking strength.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Fellowship',
    phonetic: '/ˈfɛloʊʃɪp/',
    definition: 'Friendly association, especially with people who share common interests.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Ferocity',
    phonetic: '/fəˈrɒsɪti/',
    definition: 'The state of being fierce or cruel.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Fervor',
    phonetic: '/ˈfɜrvər/',
    definition: 'Intense and passionate feeling.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Fidelity',
    phonetic: '/fɪˈdɛlɪti/',
    definition: 'Faithfulness to a person, cause, or belief.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Fierceness',
    phonetic: '/ˈfɪrsnəs/',
    definition: 'The quality of being fierce or aggressive.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Filth',
    phonetic: '/fɪlθ/',
    definition: 'Disgusting dirt or contamination.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Finesse',
    phonetic: '/fɪˈnɛs/',
    definition: 'Impressive delicacy and skill.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Firmness',
    phonetic: '/ˈfɜrmnəs/',
    definition: 'The quality of being resolute and determined.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Fitness',
    phonetic: '/ˈfɪtnəs/',
    definition: 'The condition of being physically fit and healthy.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Flexibility',
    phonetic: '/ˌflɛksəˈbɪləti/',
    definition: 'The quality of bending easily without breaking; adaptability.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Focus',
    phonetic: '/ˈfoʊkəs/',
    definition: 'The center of interest or activity; concentrated attention.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Foolishness',
    phonetic: '/ˈfuːlɪʃnəs/',
    definition: 'Lack of good sense or judgment.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Forbearance',
    phonetic: '/fɔrˈbɛrəns/',
    definition: 'Patient self-control; restraint and tolerance.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Force',
    phonetic: '/fɔrs/',
    definition: 'Strength or energy as an attribute of physical action or movement.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Forgiveness',
    phonetic: '/fərˈɡɪvnəs/',
    definition: 'The action or process of forgiving or being forgiven.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Fortitude',
    phonetic: '/ˈfɔrtɪˌtud/',
    definition: 'Courage in pain or adversity.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Fortune',
    phonetic: '/ˈfɔrtʃən/',
    definition: 'Chance or luck as an external, arbitrary force affecting human affairs.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Freedom',
    phonetic: '/ˈfridəm/',
    definition: 'The power or right to act, speak, or think as one wants.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Freshness',
    phonetic: '/ˈfrɛʃnəs/',
    definition: 'The quality of being pleasantly new or different.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Friendship',
    phonetic: '/ˈfrɛndʃɪp/',
    definition: 'The emotions or conduct of friends; the state of being friends.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Frustration',
    phonetic: '/frʌˈstreɪʃən/',
    definition: 'The feeling of being upset or annoyed as a result of being unable to change or achieve something.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Fulfillment',
    phonetic: '/fʊlˈfɪlmənt/',
    definition: 'The achievement of something desired, promised, or predicted.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Fun',
    phonetic: '/fʌn/',
    definition: 'Enjoyment, amusement, or lighthearted pleasure.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Fury',
    phonetic: '/ˈfjʊri/',
    definition: 'Wild or violent anger.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Gallantry',
    phonetic: '/ˈɡæləntri/',
    definition: 'Courageous behavior, especially in battle.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Generosity',
    phonetic: '/ˌdʒɛnəˈrɒsɪti/',
    definition: 'The quality of being kind and generous.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Genius',
    phonetic: '/ˈdʒiːniəs/',
    definition: 'Exceptional intellectual or creative power or other natural ability.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Gentleness',
    phonetic: '/ˈdʒɛntlnəs/',
    definition: 'The quality of being kind, tender, or mild-mannered.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Glory',
    phonetic: '/ˈɡlɔri/',
    definition: 'High renown or honor won by notable achievements.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Gloom',
    phonetic: '/ɡluːm/',
    definition: 'Partial or total darkness; a state of depression or despondency.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Grace',
    phonetic: '/ɡreɪs/',
    definition: 'Smoothness and elegance of movement; courteous goodwill.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Gratitude',
    phonetic: '/ˈɡrætɪˌtud/',
    definition: 'The quality of being thankful; readiness to show appreciation.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Greed',
    phonetic: '/ɡrid/',
    definition: 'Intense and selfish desire for something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Grief',
    phonetic: '/ɡrif/',
    definition: 'Deep sorrow, especially that caused by someone\'s death.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Growth',
    phonetic: '/ɡroʊθ/',
    definition: 'The process of developing physically, mentally, or spiritually.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Guilt',
    phonetic: '/ɡɪlt/',
    definition: 'The fact of having committed a specified or implied offense or crime.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Happiness',
    phonetic: '/ˈhæpinəs/',
    definition: 'The state of being happy.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Harmony',
    phonetic: '/ˈhɑrməni/',
    definition: 'The state of being in agreement or concord.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Harshness',
    phonetic: '/ˈhɑrʃnəs/',
    definition: 'The quality of being unpleasantly rough or jarring to the senses.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Hatred',
    phonetic: '/ˈheɪtrɪd/',
    definition: 'Intense dislike or ill will.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Health',
    phonetic: '/hɛlθ/',
    definition: 'The state of being free from illness or injury.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Heart',
    phonetic: '/hɑrt/',
    definition: 'The center of a person\'s thoughts and emotions.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Heartache',
    phonetic: '/ˈhɑrtˌeɪk/',
    definition: 'Emotional anguish or grief.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Helpfulness',
    phonetic: '/ˈhɛlpfəlnəs/',
    definition: 'The property of providing useful assistance.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Helplessness',
    phonetic: '/ˈhɛlplɪsnəs/',
    definition: 'The inability to defend oneself or to act without help.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Heroism',
    phonetic: '/ˈhɛroʊˌɪzəm/',
    definition: 'Great bravery; the qualities or attributes of a hero.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Hesitation',
    phonetic: '/ˌhɛzɪˈteɪʃən/',
    definition: 'The action of pausing before acting.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Honesty',
    phonetic: '/ˈɒnɪsti/',
    definition: 'The quality of being honest.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Honor',
    phonetic: '/ˈɒnər/',
    definition: 'High respect; great esteem.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Hope',
    phonetic: '/hoʊp/',
    definition: 'A feeling of expectation and desire for a certain thing to happen.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Hopelessness',
    phonetic: '/ˈhoʊplɪsnəs/',
    definition: 'A feeling or state of despair; lack of hope.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Horror',
    phonetic: '/ˈhɔrər/',
    definition: 'An intense feeling of fear, shock, or disgust.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Hospitality',
    phonetic: '/ˌhɒspɪˈtæləti/',
    definition: 'The friendly and generous reception and entertainment of guests.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Hostility',
    phonetic: '/hɒˈstɪləti/',
    definition: 'Hostile behavior; unfriendliness or opposition.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Humbleness',
    phonetic: '/ˈhʌmbəlnəs/',
    definition: 'The quality of having or showing a modest or low estimate of one\'s importance.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Humiliation',
    phonetic: '/hjuˌmɪliˈeɪʃən/',
    definition: 'The action of humiliating someone or the state of being humiliated.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Humor',
    phonetic: '/ˈhjumər/',
    definition: 'The quality of being amusing or comic.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Hunger',
    phonetic: '/ˈhʌŋɡər/',
    definition: 'A strong desire or craving.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Hurt',
    phonetic: '/hɜrt/',
    definition: 'Physical or emotional pain or damage.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Hypocrisy',
    phonetic: '/hɪˈpɒkrəsi/',
    definition: 'The practice of claiming moral standards to which one\'s own behavior does not conform.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Idealism',
    phonetic: '/aɪˈdiːəˌlɪzəm/',
    definition: 'The practice of forming or pursuing ideals.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Identity',
    phonetic: '/aɪˈdɛntɪti/',
    definition: 'The characteristics determining who or what a person or thing is.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Idiocy',
    phonetic: '/ˈɪdiəsi/',
    definition: 'Extreme stupidity or foolishness.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Idleness',
    phonetic: '/ˈaɪdəlnəs/',
    definition: 'The state of being inactive or lazy.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Ignorance',
    phonetic: '/ˈɪɡnərəns/',
    definition: 'Lack of knowledge or information.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Illumination',
    phonetic: '/ɪˌluːmɪˈneɪʃən/',
    definition: 'The action of illuminating or state of being illuminated.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Illusion',
    phonetic: '/ɪˈluːʒən/',
    definition: 'A false idea or belief.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Imagination',
    phonetic: '/ɪˌmædʒɪˈneɪʃən/',
    definition: 'The faculty or action of forming new ideas or concepts.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Immaturity',
    phonetic: '/ˌɪməˈtʃʊrɪti/',
    definition: 'The state of being immature or underdeveloped.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Immediacy',
    phonetic: '/ɪˈmiːdiəsi/',
    definition: 'The quality of bringing one into direct and instant involvement.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Immensity',
    phonetic: '/ɪˈmɛnsɪti/',
    definition: 'The extremely large size, extent, or degree of something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Impatience',
    phonetic: '/ɪmˈpeɪʃəns/',
    definition: 'The tendency to be impatient; irritability or restlessness.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Imperfection',
    phonetic: '/ˌɪmpərˈfɛkʃən/',
    definition: 'A fault, blemish, or undesirable feature.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Impertinence',
    phonetic: '/ɪmˈpɜrtɪnəns/',
    definition: 'Lack of respect; rudeness.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Impetus',
    phonetic: '/ˈɪmpɪtəs/',
    definition: 'The force or energy with which a body moves.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Importance',
    phonetic: '/ɪmˈpɔrtəns/',
    definition: 'The quality of being significant or having influence.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Impossibility',
    phonetic: '/ɪmˌpɒsəˈbɪlɪti/',
    definition: 'The state or fact of being impossible.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Impotence',
    phonetic: '/ˈɪmpətəns/',
    definition: 'The inability to take effective action; helplessness.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Impression',
    phonetic: '/ɪmˈprɛʃən/',
    definition: 'An idea, feeling, or opinion about something or someone.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Improvement',
    phonetic: '/ɪmˈpruːvmənt/',
    definition: 'The act or process of making something better.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Impudence',
    phonetic: '/ˈɪmpjʊdəns/',
    definition: 'The quality of being impudent or impertinent.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Impulse',
    phonetic: '/ˈɪmpʌls/',
    definition: 'A sudden strong and unreflective urge or desire to act.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Impurity',
    phonetic: '/ɪmˈpjʊrɪti/',
    definition: 'The quality of being impure or contaminated.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Inability',
    phonetic: '/ˌɪnəˈbɪlɪti/',
    definition: 'Lack of the means or power to do something.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Inaction',
    phonetic: '/ɪnˈækʃən/',
    definition: 'Lack of action where some is expected or appropriate.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Inadequacy',
    phonetic: '/ɪnˈædɪkwəsi/',
    definition: 'The state or quality of being inadequate; lack of the quality required.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Inanity',
    phonetic: '/ɪˈneɪnɪti/',
    definition: 'Lack of sense or meaning; foolishness.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Inattention',
    phonetic: '/ˌɪnəˈtɛnʃən/',
    definition: 'Lack of attention; failure to notice something.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Incapability',
    phonetic: '/ɪnˌkeɪpəˈbɪlɪti/',
    definition: 'The quality of being incapable; inability.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Incentive',
    phonetic: '/ɪnˈsɛntɪv/',
    definition: 'A thing that motivates or encourages someone to do something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Incidence',
    phonetic: '/ˈɪnsɪdəns/',
    definition: 'The occurrence, rate, or frequency of a disease, crime, or other unwanted thing.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Inclination',
    phonetic: '/ˌɪnklɪˈneɪʃən/',
    definition: 'A person\'s natural tendency or urge to act or feel in a particular way.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Incompetence',
    phonetic: '/ɪnˈkɒmpɪtəns/',
    definition: 'Inability to do something successfully; ineptitude.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Inconsistency',
    phonetic: '/ˌɪnkənˈsɪstənsi/',
    definition: 'The quality of being inconsistent.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Indecision',
    phonetic: '/ˌɪndɪˈsɪʒən/',
    definition: 'The inability to make a decision quickly.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Independence',
    phonetic: '/ˌɪndɪˈpɛndəns/',
    definition: 'The state of being free from the control or influence of others.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Indifference',
    phonetic: '/ɪnˈdɪfrəns/',
    definition: 'Lack of interest, concern, or sympathy.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Indignation',
    phonetic: '/ˌɪndɪɡˈneɪʃən/',
    definition: 'Anger or annoyance provoked by what is perceived as unfair treatment.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Individuality',
    phonetic: '/ˌɪndɪˌvɪdʒuˈælɪti/',
    definition: 'The quality or character of a particular person or thing that distinguishes them from others.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Indolence',
    phonetic: '/ˈɪndələns/',
    definition: 'Avoidance of activity or exertion; laziness.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Indulgence',
    phonetic: '/ɪnˈdʌldʒəns/',
    definition: 'The action or fact of indulging or yielding to an inclination.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Industry',
    phonetic: '/ˈɪndəstri/',
    definition: 'Diligence and hard work.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Inefficiency',
    phonetic: '/ˌɪnɪˈfɪʃənsi/',
    definition: 'Lack of ability to do something well or achieve a desired result.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Inequality',
    phonetic: '/ˌɪnɪˈkwɒlɪti/',
    definition: 'Difference in size, degree, circumstances, etc.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Inevitability',
    phonetic: '/ɪˌnɛvɪtəˈbɪlɪti/',
    definition: 'The quality of being certain to happen.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Infamy',
    phonetic: '/ˈɪnfəmi/',
    definition: 'The state of being well known for some bad quality or deed.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Infatuation',
    phonetic: '/ɪnˌfætʃuˈeɪʃən/',
    definition: 'An intense but short-lived passion or admiration for someone or something.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Inference',
    phonetic: '/ˈɪnfərəns/',
    definition: 'A conclusion reached on the basis of evidence and reasoning.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Inferiority',
    phonetic: '/ɪnˌfɪriˈɔrɪti/',
    definition: 'The condition of being lower in status or quality than another.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Infinity',
    phonetic: '/ɪnˈfɪnɪti/',
    definition: 'The state or quality of being infinite.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Influence',
    phonetic: '/ˈɪnfluəns/',
    definition: 'The capacity to have an effect on the character, development, or behavior of someone or something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Information',
    phonetic: '/ˌɪnfərˈmeɪʃən/',
    definition: 'Facts provided or learned about something or someone.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Ingenuity',
    phonetic: '/ˌɪndʒəˈnuːɪti/',
    definition: 'The quality of being clever, original, and inventive.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Ingratitude',
    phonetic: '/ɪnˈɡrætɪˌtjuːd/',
    definition: 'Lack of gratitude; ungratefulness.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Initiative',
    phonetic: '/ɪˈnɪʃətɪv/',
    definition: 'The ability to assess and initiate things independently.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Injustice',
    phonetic: '/ɪnˈdʒʌstɪs/',
    definition: 'Lack of fairness or justice.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Innovation',
    phonetic: '/ˌɪnəˈveɪʃən/',
    definition: 'The action or process of innovating; a new method, idea, product.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Inquisitiveness',
    phonetic: '/ɪnˈkwɪzɪtɪvnəs/',
    definition: 'The quality of being inquisitive; curiosity.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Insanity',
    phonetic: '/ɪnˈsænɪti/',
    definition: 'The state of being seriously mentally ill; madness.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Insecurity',
    phonetic: '/ˌɪnsɪˈkjʊrɪti/',
    definition: 'Uncertainty or anxiety about oneself; lack of confidence.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Insight',
    phonetic: '/ˈɪnˌsaɪt/',
    definition: 'The capacity to gain an accurate and deep understanding.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Inspiration',
    phonetic: '/ˌɪnspɪˈreɪʃən/',
    definition: 'The process of being mentally stimulated to do or feel something.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Instability',
    phonetic: '/ˌɪnstəˈbɪlɪti/',
    definition: 'The state of being unstable; lack of stability.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Instinct',
    phonetic: '/ˈɪnstɪŋkt/',
    definition: 'An innate, typically fixed pattern of behavior.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Integrity',
    phonetic: '/ɪnˈtɛɡrɪti/',
    definition: 'The quality of being honest and having strong moral principles.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Intelligence',
    phonetic: '/ɪnˈtɛlɪdʒəns/',
    definition: 'The ability to acquire and apply knowledge and skills.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Intensity',
    phonetic: '/ɪnˈtɛnsɪti/',
    definition: 'The quality of being intense; great energy, strength, or concentration.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Interest',
    phonetic: '/ˈɪntrəst/',
    definition: 'The feeling of wanting to know or learn about something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Interference',
    phonetic: '/ˌɪntərˈfɪrəns/',
    definition: 'The action of interfering or preventing a process or activity.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Intolerance',
    phonetic: '/ɪnˈtɒlərəns/',
    definition: 'Unwillingness to accept views, beliefs, or behavior that differ from one\'s own.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Intrigue',
    phonetic: '/ɪnˈtriːɡ/',
    definition: 'The quality of being fascinating or mysterious.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Intuition',
    phonetic: '/ˌɪntuˈɪʃən/',
    definition: 'The ability to understand something immediately, without conscious reasoning.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Invasion',
    phonetic: '/ɪnˈveɪʒən/',
    definition: 'An unwelcome intrusion into another\'s domain.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Invention',
    phonetic: '/ɪnˈvɛnʃən/',
    definition: 'The action of creating something new.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Investment',
    phonetic: '/ɪnˈvɛstmənt/',
    definition: 'The action of investing time, effort, or resources.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Invitation',
    phonetic: '/ˌɪnvɪˈteɪʃən/',
    definition: 'A written or verbal request to participate or join.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Irony',
    phonetic: '/ˈaɪrəni/',
    definition: 'The expression of meaning using language that normally signifies the opposite.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Irrationality',
    phonetic: '/ɪˌræʃəˈnælɪti/',
    definition: 'The quality of being illogical or unreasonable.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Irritation',
    phonetic: '/ˌɪrɪˈteɪʃən/',
    definition: 'The state of feeling annoyed, impatient, or angry.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Isolation',
    phonetic: '/ˌaɪsəˈleɪʃən/',
    definition: 'The state of being alone or separated from others.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Jealousy',
    phonetic: '/ˈdʒɛləsi/',
    definition: 'The state or feeling of being jealous.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Jeopardy',
    phonetic: '/ˈdʒɛpərdi/',
    definition: 'Danger of loss, harm, or failure.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Joy',
    phonetic: '/dʒɔɪ/',
    definition: 'A feeling of great pleasure and happiness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Judgment',
    phonetic: '/ˈdʒʌdʒmənt/',
    definition: 'The ability to make considered decisions or come to sensible conclusions.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Justice',
    phonetic: '/ˈdʒʌstɪs/',
    definition: 'Just behavior or treatment; fairness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Justification',
    phonetic: '/ˌdʒʌstɪfɪˈkeɪʃən/',
    definition: 'The action of showing something to be right or reasonable.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Keenness',
    phonetic: '/ˈkiːnnəs/',
    definition: 'The quality of being eager or enthusiastic.',
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
    word: 'Knowledge',
    phonetic: '/ˈnɒlɪdʒ/',
    definition: 'Facts, information, and skills acquired through experience or education.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Laughter',
    phonetic: '/ˈlæftər/',
    definition: 'The action or sound of laughing.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Leadership',
    phonetic: '/ˈliːdərʃɪp/',
    definition: 'The action of leading a group of people or an organization.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Learning',
    phonetic: '/ˈlɜːrnɪŋ/',
    definition: 'The acquisition of knowledge or skills through study, experience, or teaching.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Legacy',
    phonetic: '/ˈlɛɡəsi/',
    definition: 'Something left or handed down by a predecessor.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Lethargy',
    phonetic: '/ˈlɛθərdʒi/',
    definition: 'A lack of energy and enthusiasm.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Liberation',
    phonetic: '/ˌlɪbəˈreɪʃən/',
    definition: 'The act of setting someone free from imprisonment, slavery, or oppression.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Liberty',
    phonetic: '/ˈlɪbərti/',
    definition: 'The state of being free within society from oppressive restrictions.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Life',
    phonetic: '/laɪf/',
    definition: 'The condition that distinguishes animals and plants from inorganic matter.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Light',
    phonetic: '/laɪt/',
    definition: 'The natural agent that stimulates sight and makes things visible.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Liveliness',
    phonetic: '/ˈlaɪvlinəs/',
    definition: 'The quality of being energetic and enthusiastic.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Logic',
    phonetic: '/ˈlɒdʒɪk/',
    definition: 'Reasoning conducted or assessed according to strict principles of validity.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Loneliness',
    phonetic: '/ˈloʊnlinəs/',
    definition: 'Sadness because one has no friends or company.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Loss',
    phonetic: '/lɔs/',
    definition: 'The fact or process of losing something or someone.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Love',
    phonetic: '/lʌv/',
    definition: 'An intense feeling of deep affection.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Loyalty',
    phonetic: '/ˈlɔɪəlti/',
    definition: 'The quality of being loyal to someone or something.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Luck',
    phonetic: '/lʌk/',
    definition: 'Success or failure apparently brought by chance.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Luxury',
    phonetic: '/ˈlʌkʃəri/',
    definition: 'The state of great comfort and extravagant living.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Madness',
    phonetic: '/ˈmædnəs/',
    definition: 'The state of being mentally ill or extremely foolish.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Magnificence',
    phonetic: '/mæɡˈnɪfɪsəns/',
    definition: 'The quality of being magnificent; splendor.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Malice',
    phonetic: '/ˈmælɪs/',
    definition: 'The intention or desire to do evil; ill will.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Manipulation',
    phonetic: '/məˌnɪpjuˈleɪʃən/',
    definition: 'The action of manipulating someone in a clever or unscrupulous way.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Mastery',
    phonetic: '/ˈmæstəri/',
    definition: 'Comprehensive knowledge or skill in a subject or accomplishment.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Maturity',
    phonetic: '/məˈtʃʊrəti/',
    definition: 'The quality of being fully developed or adult.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Meanness',
    phonetic: '/ˈmiːnnəs/',
    definition: 'The quality of being unkind, spiteful, or unfair.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Mediocrity',
    phonetic: '/ˌmiːdiˈɒkrəti/',
    definition: 'The quality of being average or ordinary.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Meditation',
    phonetic: '/ˌmɛdɪˈteɪʃən/',
    definition: 'The practice of focusing one\'s mind for a period of time.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Melancholy',
    phonetic: '/ˈmɛlənˌkɒli/',
    definition: 'A feeling of pensive sadness, typically with no obvious cause.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Memory',
    phonetic: '/ˈmɛməri/',
    definition: 'The faculty by which the mind stores and remembers information.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Mercy',
    phonetic: '/ˈmɜrsi/',
    definition: 'Compassion or forgiveness shown toward someone.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Merit',
    phonetic: '/ˈmɛrɪt/',
    definition: 'The quality of being particularly good or worthy.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Mindfulness',
    phonetic: '/ˈmaɪn(d)fəlnəs/',
    definition: 'The quality or state of being conscious or aware of something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Misery',
    phonetic: '/ˈmɪzəri/',
    definition: 'A state or feeling of great distress or discomfort.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Mistrust',
    phonetic: '/mɪsˈtrʌst/',
    definition: 'Lack of trust or confidence.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Modesty',
    phonetic: '/ˈmɒdɪsti/',
    definition: 'The quality of being unassuming or moderate in the estimation of one\'s abilities.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Monotony',
    phonetic: '/məˈnɒtəni/',
    definition: 'Lack of variety and interest; tedious repetition and routine.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Morality',
    phonetic: '/məˈrælɪti/',
    definition: 'Principles concerning the distinction between right and wrong.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Motivation',
    phonetic: '/ˌmoʊtɪˈveɪʃən/',
    definition: 'The reason or reasons one has for acting or behaving in a particular way.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Mystery',
    phonetic: '/ˈmɪstəri/',
    definition: 'Something that is difficult or impossible to understand or explain.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Naivety',
    phonetic: '/naɪˈiːvəti/',
    definition: 'Lack of experience, wisdom, or judgment.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Narcissism',
    phonetic: '/ˈnɑrsɪˌsɪzəm/',
    definition: 'Excessive interest in or admiration of oneself.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Nastiness',
    phonetic: '/ˈnæstinəs/',
    definition: 'The quality of being unpleasant, unkind, or offensive.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Nature',
    phonetic: '/ˈneɪtʃər/',
    definition: 'The physical world and its natural features and processes.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Neatness',
    phonetic: '/ˈniːtnəs/',
    definition: 'The quality of being arranged in an orderly, tidy way.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Necessity',
    phonetic: '/nəˈsɛsɪti/',
    definition: 'The fact of being required or indispensable.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Need',
    phonetic: '/niːd/',
    definition: 'Require (something) because it is essential or very important.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Negativity',
    phonetic: '/ˌnɛɡəˈtɪvɪti/',
    definition: 'The expression of criticism or pessimism.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Negligence',
    phonetic: '/ˈnɛɡlɪdʒəns/',
    definition: 'Failure to take proper care in doing something.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Neutrality',
    phonetic: '/nuˈtrælɪti/',
    definition: 'The state of not supporting or helping either side in a conflict.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Nobility',
    phonetic: '/noʊˈbɪlɪti/',
    definition: 'The quality of being noble in character.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Noise',
    phonetic: '/nɔɪz/',
    definition: 'A sound, especially one that is loud or unpleasant.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Normality',
    phonetic: '/nɔrˈmælɪti/',
    definition: 'The condition of being normal; the state of being usual or expected.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Nostalgia',
    phonetic: '/nɒˈstældʒə/',
    definition: 'A sentimental longing for the past.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Nothingness',
    phonetic: '/ˈnʌθɪŋnəs/',
    definition: 'The state or fact of being nothing; nonexistence.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Nourishment',
    phonetic: '/ˈnɜrɪʃmənt/',
    definition: 'The food or other substances necessary for growth and health.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Novelty',
    phonetic: '/ˈnɒvəlti/',
    definition: 'The quality of being new, original, or unusual.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Nurture',
    phonetic: '/ˈnɜrtʃər/',
    definition: 'The process of caring for and encouraging growth or development.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Obedience',
    phonetic: '/oʊˈbiːdiəns/',
    definition: 'Compliance with an order, request, or law.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Objectivity',
    phonetic: '/ˌɒbdʒɛkˈtɪvɪti/',
    definition: 'The quality of being uninfluenced by personal feelings or opinions.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Obligation',
    phonetic: '/ˌɒblɪˈɡeɪʃən/',
    definition: 'An act or course of action to which a person is morally or legally bound.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Obscurity',
    phonetic: '/əbˈskjʊrɪti/',
    definition: 'The state of being unknown, inconspicuous, or difficult to understand.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Observation',
    phonetic: '/ˌɒbzərˈveɪʃən/',
    definition: 'The action or process of observing something or someone.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Obsession',
    phonetic: '/əbˈsɛʃən/',
    definition: 'An idea or thought that continually preoccupies or intrudes on a person\'s mind.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Obstinacy',
    phonetic: '/ˈɒbstɪnəsi/',
    definition: 'The quality of being stubborn.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Openness',
    phonetic: '/ˈoʊpənnəs/',
    definition: 'The quality of being honest and transparent.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Opportunity',
    phonetic: '/ˌɒpərˈtunəti/',
    definition: 'A set of circumstances that makes it possible to do something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Optimism',
    phonetic: '/ˈɒptɪmɪzəm/',
    definition: 'Hopefulness and confidence about the future or success of something.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Order',
    phonetic: '/ˈɔrdər/',
    definition: 'The arrangement or disposition of people or things in relation to each other.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Organization',
    phonetic: '/ˌɔrɡənəˈzeɪʃən/',
    definition: 'The quality of being systematic and efficient.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Originality',
    phonetic: '/əˌrɪdʒəˈnæləti/',
    definition: 'The quality of being novel or unusual.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Pain',
    phonetic: '/peɪn/',
    definition: 'Physical suffering or discomfort.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Panic',
    phonetic: '/ˈpænɪk/',
    definition: 'Sudden uncontrollable fear or anxiety.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Paradise',
    phonetic: '/ˈpærəˌdaɪs/',
    definition: 'A place or state of perfect happiness.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Paranoia',
    phonetic: '/ˌpærəˈnɔɪə/',
    definition: 'Unreasonable suspicion and mistrust of others.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Passion',
    phonetic: '/ˈpæʃən/',
    definition: 'Strong and barely controllable emotion.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Patience',
    phonetic: '/ˈpeɪʃəns/',
    definition: 'The capacity to accept or tolerate delay, trouble, or suffering.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Peace',
    phonetic: '/piːs/',
    definition: 'Freedom from disturbance; tranquility.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Peculiarity',
    phonetic: '/pɪˌkjuliˈærɪti/',
    definition: 'The quality of being different from the usual or normal.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Perfection',
    phonetic: '/pərˈfɛkʃən/',
    definition: 'The state or quality of being perfect.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Perseverance',
    phonetic: '/ˌpɜrsəˈvɪrəns/',
    definition: 'Persistence in doing something despite difficulty.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Persistence',
    phonetic: '/pərˈsɪstəns/',
    definition: 'Firm or obstinate continuance in a course of action.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Perspective',
    phonetic: '/pərˈspɛktɪv/',
    definition: 'A particular attitude toward or way of regarding something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Persuasion',
    phonetic: '/pərˈsweɪʒən/',
    definition: 'The action or process of persuading someone.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Pessimism',
    phonetic: '/ˈpɛsɪˌmɪzəm/',
    definition: 'A tendency to see the worst aspect of things.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Philanthropy',
    phonetic: '/fɪˈlænθrəpi/',
    definition: 'The desire to promote the welfare of others.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Piety',
    phonetic: '/ˈpaɪəti/',
    definition: 'The quality of being religious or reverent.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Pity',
    phonetic: '/ˈpɪti/',
    definition: 'The feeling of sorrow and compassion caused by the suffering of others.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Pleasure',
    phonetic: '/ˈplɛʒər/',
    definition: 'A feeling of happy satisfaction and enjoyment.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Poise',
    phonetic: '/pɔɪz/',
    definition: 'Graceful and elegant bearing in a person.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Politeness',
    phonetic: '/pəˈlaɪtnəs/',
    definition: 'Behavior that is respectful and considerate of others.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Positivity',
    phonetic: '/ˌpɒzəˈtɪvəti/',
    definition: 'The practice of being positive.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Possibility',
    phonetic: '/ˌpɒsəˈbɪləti/',
    definition: 'A thing that may happen or be the case.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Poverty',
    phonetic: '/ˈpɒvərti/',
    definition: 'The state of being extremely poor.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Power',
    phonetic: '/ˈpaʊər/',
    definition: 'The ability or capacity to do something or act in a particular way.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Practicality',
    phonetic: '/ˌpræktɪˈkæləti/',
    definition: 'The quality of being suited to actual conditions.',
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
    word: 'Prayer',
    phonetic: '/prɛr/',
    definition: 'A solemn request for help or expression of thanks.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Precision',
    phonetic: '/prɪˈsɪʒən/',
    definition: 'The quality of being exact and accurate.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Prejudice',
    phonetic: '/ˈprɛdʒudɪs/',
    definition: 'Preconceived opinion that is not based on reason or actual experience.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Presence',
    phonetic: '/ˈprɛzəns/',
    definition: 'The state or fact of existing, occurring, or being present.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Pride',
    phonetic: '/praɪd/',
    definition: 'A feeling of deep pleasure or satisfaction derived from achievements.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Privacy',
    phonetic: '/ˈpraɪvəsi/',
    definition: 'The state of being free from public attention.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Privilege',
    phonetic: '/ˈprɪvəlɪdʒ/',
    definition: 'A special right, advantage, or immunity granted or available only to a particular person or group.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Progress',
    phonetic: '/ˈprɒɡrɛs/',
    definition: 'Forward or onward movement toward a destination.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Promise',
    phonetic: '/ˈprɒmɪs/',
    definition: 'A declaration that one will do or refrain from doing something specified.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Prosperity',
    phonetic: '/prɒˈspɛrɪti/',
    definition: 'The state of being prosperous; success or wealth.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Protection',
    phonetic: '/prəˈtɛkʃən/',
    definition: 'The action of protecting, or the state of being protected.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Prudence',
    phonetic: '/ˈpruːdəns/',
    definition: 'The quality of being prudent; carefulness.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Punctuality',
    phonetic: '/ˌpʌŋktʃuˈæləti/',
    definition: 'The characteristic of being able to complete a required task or fulfill an obligation before or at a previously designated time.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Purpose',
    phonetic: '/ˈpɜrpəs/',
    definition: 'The reason for which something is done or created or for which something exists.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Puzzlement',
    phonetic: '/ˈpʌzəlmənt/',
    definition: 'The state of being puzzled; perplexity.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Quality',
    phonetic: '/ˈkwɒlɪti/',
    definition: 'The standard of something as measured against other things of a similar kind.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Quietness',
    phonetic: '/ˈkwaɪətnəs/',
    definition: 'The state of being quiet, calm, and peaceful.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Radiance',
    phonetic: '/ˈreɪdiəns/',
    definition: 'Light or heat as emitted or reflected by something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Rage',
    phonetic: '/reɪdʒ/',
    definition: 'Violent, uncontrollable anger.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Rationality',
    phonetic: '/ˌræʃəˈnæləti/',
    definition: 'The quality of being based on or in accordance with reason or logic.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Reality',
    phonetic: '/riˈæləti/',
    definition: 'The state of things as they actually exist.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Reason',
    phonetic: '/ˈriːzən/',
    definition: 'The power of the mind to think, understand, and form judgments.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Rebellion',
    phonetic: '/rɪˈbɛljən/',
    definition: 'The action or process of resisting authority, control, or convention.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Recognition',
    phonetic: '/ˌrɛkəɡˈnɪʃən/',
    definition: 'Acknowledgment of something\'s existence, validity, or legality.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Recovery',
    phonetic: '/rɪˈkʌvəri/',
    definition: 'A return to a normal state of health, mind, or strength.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Redemption',
    phonetic: '/rɪˈdɛmpʃən/',
    definition: 'The action of saving or being saved from sin, error, or evil.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Refinement',
    phonetic: '/rɪˈfaɪnmənt/',
    definition: 'The process of removing impurities or unwanted elements.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Reflection',
    phonetic: '/rɪˈflɛkʃən/',
    definition: 'Serious thought or consideration.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Regret',
    phonetic: '/rɪˈɡrɛt/',
    definition: 'A feeling of sadness about something sad or wrong or about a mistake.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Rejection',
    phonetic: '/rɪˈdʒɛkʃən/',
    definition: 'The dismissing or refusing of a proposal, idea, etc.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Relaxation',
    phonetic: '/ˌriːlækˈseɪʃən/',
    definition: 'The state of being free from tension and anxiety.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Relief',
    phonetic: '/rɪˈliːf/',
    definition: 'A feeling of reassurance and relaxation following release from anxiety or distress.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Reliance',
    phonetic: '/rɪˈlaɪəns/',
    definition: 'Dependence on or trust in someone or something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Remorse',
    phonetic: '/rɪˈmɔːrs/',
    definition: 'Deep regret or guilt for a wrong committed.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Renewal',
    phonetic: '/rɪˈnjuːəl/',
    definition: 'The replacing or repair of something that is worn out, run-down, or broken.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Repentance',
    phonetic: '/rɪˈpɛntəns/',
    definition: 'The action of sincere regret or remorse.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Resentment',
    phonetic: '/rɪˈzɛntmənt/',
    definition: 'Bitter indignation at having been treated unfairly.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Resilience',
    phonetic: '/rɪˈzɪliəns/',
    definition: 'The capacity to recover quickly from difficulties.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Resistance',
    phonetic: '/rɪˈzɪstəns/',
    definition: 'The refusal to accept or comply with something.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Resolution',
    phonetic: '/ˌrɛzəˈluːʃən/',
    definition: 'A firm decision to do or not to do something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Respect',
    phonetic: '/rɪˈspɛkt/',
    definition: 'A feeling of deep admiration for someone or something.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Responsibility',
    phonetic: '/rɪˌspɒnsəˈbɪlɪti/',
    definition: 'The state or fact of having a duty to deal with something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Rest',
    phonetic: '/rɛst/',
    definition: 'Cease work or movement in order to relax, refresh oneself, or recover strength.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Restraint',
    phonetic: '/rɪˈstreɪnt/',
    definition: 'Self-control; calm and reasonable behavior.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Reverence',
    phonetic: '/ˈrɛvərəns/',
    definition: 'Deep respect for someone or something.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Righteousness',
    phonetic: '/ˈraɪtʃəsnəs/',
    definition: 'The quality of being morally right or justifiable.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Risk',
    phonetic: '/rɪsk/',
    definition: 'A situation involving exposure to danger.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Romance',
    phonetic: '/roʊˈmæns/',
    definition: 'A feeling of excitement and mystery associated with love.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Rudeness',
    phonetic: '/ˈruːdnəs/',
    definition: 'Offensively impolite or ill-mannered behavior.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Sacrifice',
    phonetic: '/ˈsækrɪfaɪs/',
    definition: 'The act of giving up something valued for the sake of something else.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Sadness',
    phonetic: '/ˈsædnəs/',
    definition: 'The condition or quality of being sad.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Safety',
    phonetic: '/ˈseɪfti/',
    definition: 'The condition of being protected from danger, risk, or injury.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Sanctity',
    phonetic: '/ˈsæŋktɪti/',
    definition: 'The state or quality of being holy, sacred, or saintly.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Satisfaction',
    phonetic: '/ˌsætɪsˈfækʃən/',
    definition: 'Fulfillment of one\'s wishes, expectations, or needs.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Scorn',
    phonetic: '/skɔrn/',
    definition: 'The feeling or belief that someone or something is worthless or despicable.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Security',
    phonetic: '/sɪˈkjʊrɪti/',
    definition: 'The state of being free from danger or threat.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Serenity',
    phonetic: '/səˈrɛnɪti/',
    definition: 'The state of being calm, peaceful, and untroubled.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Service',
    phonetic: '/ˈsɜrvɪs/',
    definition: 'The action of helping or doing work for someone.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Shame',
    phonetic: '/ʃeɪm/',
    definition: 'A painful feeling of humiliation or distress.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Sharing',
    phonetic: '/ˈʃɛrɪŋ/',
    definition: 'The joint use of a resource or space.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Shock',
    phonetic: '/ʃɒk/',
    definition: 'A sudden upsetting or surprising event or experience.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Silence',
    phonetic: '/ˈsaɪləns/',
    definition: 'Complete absence of sound.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Simplicity',
    phonetic: '/sɪmˈplɪsɪti/',
    definition: 'The quality or condition of being easy to understand or do.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Sincerity',
    phonetic: '/sɪnˈsɛrɪti/',
    definition: 'The quality of being free from pretense, deceit, or hypocrisy.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Skill',
    phonetic: '/skɪl/',
    definition: 'The ability to do something well; expertise.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Sloth',
    phonetic: '/sloʊθ/',
    definition: 'Reluctance to work or make an effort; laziness.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Solitude',
    phonetic: '/ˈsɒlɪtjuːd/',
    definition: 'The state or situation of being alone.',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Sorrow',
    phonetic: '/ˈsɒroʊ/',
    definition: 'A feeling of deep distress caused by loss, disappointment, or other misfortune.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Spirituality',
    phonetic: '/ˌspɪrɪtʃuˈæləti/',
    definition: 'The quality of being concerned with the human spirit or soul.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Spontaneity',
    phonetic: '/ˌspɒntəˈneɪəti/',
    definition: 'The quality of being natural and unconstrained.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Stability',
    phonetic: '/stəˈbɪləti/',
    definition: 'The state of being stable and not likely to change or fail.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Stagnation',
    phonetic: '/stæɡˈneɪʃən/',
    definition: 'The state of not flowing or moving.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Strength',
    phonetic: '/strɛŋθ/',
    definition: 'The quality or state of being physically or mentally strong.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Stress',
    phonetic: '/strɛs/',
    definition: 'State of mental or emotional strain or tension.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Struggle',
    phonetic: '/ˈstrʌɡəl/',
    definition: 'Make forceful or violent efforts to get free of restraint or constriction.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Success',
    phonetic: '/səkˈsɛs/',
    definition: 'The accomplishment of an aim or purpose.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Suffering',
    phonetic: '/ˈsʌfərɪŋ/',
    definition: 'The state of undergoing pain, distress, or hardship.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Surrender',
    phonetic: '/səˈrɛndər/',
    definition: 'Cease resistance and submit to authority.',
    rating: 2,
    type: 'Negative'
  },
  {
    word: 'Survival',
    phonetic: '/sərˈvaɪvəl/',
    definition: 'The state or fact of continuing to live or exist.',
    rating: 4,
    type: 'Positive'
  },
  {
    word: 'Suspicion',
    phonetic: '/səˈspɪʃən/',
    definition: 'A feeling or thought that something is possible, likely, or true.',
    rating: 2,
    type: 'Negative'
  }
];

export async function loadWords(): Promise<Word[]> {
  return words;
}

export async function getClockWords(): Promise<Word[]> {
  return words.filter(word => word.rating >= 4);
}

export async function getAllWords(): Promise<Word[]> {
  return words;
} 