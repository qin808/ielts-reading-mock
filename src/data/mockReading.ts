// EXPORTS: IQuestion, IPassage, IReadingTest, IExamRecord, QuestionType, MOCK_READING_TEST

export type QuestionType =
  | 'true_false_not_given'
  | 'multiple_choice_single'
  | 'multiple_choice_multi'
  | 'fill_blank_summary'
  | 'fill_blank_sentence'
  | 'matching_heading'
  | 'matching_information'
  | 'matching_name';

export interface IQuestion {
  id: string;
  number: number;
  passageIndex: 1 | 2 | 3;
  type: QuestionType;
  groupInstruction?: string;
  groupRange?: string;
  questionText: string;
  options?: string[];
  blanks?: number;
  notesContent?: string; // 摘要填空题的完整笔记内容（含_____标记）
  correctAnswer: string | string[];
  userAnswer?: string | string[];
  isAnswered: boolean;
}

export interface IPassage {
  index: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  content: string;
  suggestedTime: number;
  questionRange: string;
}

export interface IReadingTest {
  id: string;
  source: 'mock' | 'user-uploaded';
  title: string;
  totalTime: number;
  passages: IPassage[];
  questions: IQuestion[];
}

export interface IExamRecord {
  id: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  bandScore?: number;
  duration: number;
  completedAt: string;
  questions: IQuestion[];
}

const passage1Content = `<p><strong>How tennis rackets have changed</strong></p>
<p>In 2016, the British professional tennis player Andy Murray was ranked as the world's number one. It was an incredible achievement by any standard – made even more remarkable by the fact that he did this during a period considered to be one of the strongest in the sport's history, competing against the likes of Rafael Nadal, Roger Federer and Novak Djokovic, to name just a few. Yet five years previously, he had been regarded as a talented outsider who entered but never won the major tournaments.</p>
<p>Of the changes that account for this transformation, one was visible and widely publicised: in 2011, Murray invited former number one player Ivan Lendl onto his coaching team – a valuable addition that had a visible impact on the player's playing style. Another change was so subtle as to pass more or less unnoticed. Like many players, Murray has long preferred a racket that consists of two types of string: one for the mains (verticals) and another for the crosses (horizontals). While he continued to use natural string in the crosses, in 2012 he switched to a synthetic string for the mains. A small change, perhaps, but its importance should not be underestimated.</p>
<p>The modification that Murray made is just one of a number of options available to players looking to tweak their rackets in order to improve their games. 'Touring professionals have their rackets customised to their specific needs,' says Colin Triplow, a UK-based professional racket stringer. 'It's a highly important part of performance maximisation.' Consequently, the specific rackets used by the world's elite are not actually readily available to the public; rather, each racket is individually made to suit the player who uses it. Take the US professional tennis players Mike and Bob Bryan, for example: 'We're very particular with our racket specifications,' they say. 'All our rackets are sent from our manufacturer to Tampa, Florida, where our frames go through a thorough customisation process.' They explain how they have adjusted not only racket length, but even experimented with different kinds of paint. The rackets they use now weigh more than the average model and also have a denser string pattern (i.e. more crosses and mains).</p>
<p>But if rackets are customised to such a high degree, can a player be sure of getting the same racket time after time? Triplow explains that with so many possible racket combinations available to the top players, the risk of inconsistency is high. 'A new racket frame comes in around 300 grams,' he says, 'but for a top player this might increase to 360 grams after lead tape has been added to the frame and silicone applied to the handle. The exact balance point of the racket is also critical – and if it isn't right, the player will know immediately.'</p>
<p>Even small differences between supposedly identical rackets can make a very significant difference at the highest levels of the sport. 'For example,' says Triplow, 'there's the way the strings feel. No two rackets are ever going to be 100 percent the same. The strings might look the same, but the tensions can vary by as much as five pounds.' That might not sound like much, but it could be the difference between winning and losing. 'Players are extremely sensitive to such differences,' says Triplow. 'They often know the moment they pick up a racket if something isn't right.'</p>
<p>Technology plays a part, of course. New materials and designs mean rackets are lighter and stronger than they were 30 years ago. But in recent years, the focus has shifted from developing racket frames to looking at strings. Since 2000, there has been a dramatic rise in the number of strings available on the market. According to Triplow, the big change came in 2004, when polyester strings became the norm. 'These are very different from traditional strings,' he says. 'They offer much more spin, which has completely transformed the game.'</p>
<p>Nevertheless, for most players it is not necessary to have such a finely tuned racket. What matters is consistency: using a racket that feels the same every time is more important than having one that is supposedly ideal. 'The average player probably doesn't need a customised racket,' says Triplow. 'But for the professionals, even the smallest details can make a huge difference.'</p>`;

const passage2Content = `<p><strong>The history of the calendar</strong></p>
<p>The ancient Egyptians were among the first people to use a calendar based on the solar year. They noticed that the Nile River flooded every year around the same time, and they used this event to mark the beginning of their calendar year. The Egyptian calendar had 365 days, divided into 12 months of 30 days each, with five extra days added at the end of the year. However, because the actual solar year is slightly longer than 365 days – by approximately one quarter of a day – the Egyptian calendar gradually became inaccurate.</p>
<p>The Julian calendar, introduced by Julius Caesar in 46 BCE, was an attempt to fix this problem. Caesar consulted with astronomers and decided to add an extra day every four years. This meant that the average length of a year became 365.25 days, which was much closer to the actual solar year. The Julian calendar remained in use for more than 1,500 years, but by the 16th century it had become out of step with the solar year by about ten days.</p>
<p>In 1582, Pope Gregory XIII introduced a new calendar that is still used today in most parts of the world. The Gregorian calendar made two important changes. First, it removed ten days from the month of October in 1582 to bring the calendar back into line with the solar year. Second, it adjusted the rule for leap years: years divisible by 100 would not be leap years unless they were also divisible by 400. This small change made the calendar much more accurate over long periods of time.</p>
<p>Not all countries adopted the Gregorian calendar immediately. Britain and its colonies did not switch until 1752, when 11 days were removed from the month of September. Russia continued to use the Julian calendar until 1918, and Greece did not adopt the Gregorian calendar until 1923. Today, however, the Gregorian calendar is used for almost all international business and government affairs.</p>
<p>Some cultures continue to use traditional calendars alongside the Gregorian calendar. The Chinese calendar, for example, is a lunisolar calendar that is based on both the moon and the sun. It is used to determine the dates of important festivals such as Chinese New Year. The Islamic calendar is a lunar calendar that has 12 months and about 354 days in a year. Because the Islamic calendar is shorter than the solar year, Islamic holidays move forward by about 11 days each year relative to the Gregorian calendar.</p>
<p>The way we measure and organise time has evolved over thousands of years, and different cultures have developed different calendar systems to suit their needs. The Gregorian calendar, now the most widely used calendar in the world, represents the most recent stage in this long process of development.</p>`;

const passage3Content = `<p><strong>The future of artificial intelligence</strong></p>
<p>Artificial intelligence (AI) has been one of the most talked-about topics in technology for many years. From self-driving cars to virtual assistants, AI is already transforming the way we live and work. But what does the future hold? Will AI continue to develop at its current rapid pace, or will we reach a point where progress slows down?</p>
<p>One area where AI is likely to have a significant impact is healthcare. AI systems can already analyse medical images such as X-rays and MRI scans with a high degree of accuracy. In the future, AI may be able to diagnose diseases at an earlier stage, potentially saving millions of lives. AI could also be used to develop new drugs more quickly and cheaply, by analysing vast amounts of medical data and identifying patterns that human researchers might miss.</p>
<p>Another important area is education. AI-powered learning tools could provide personalised education to students, adapting to each student's individual learning style and pace. This could help to reduce the gap between high-achieving and low-achieving students, and make quality education more accessible to people in remote areas. However, there are concerns that an over-reliance on AI in education could reduce the importance of human interaction between teachers and students.</p>
<p>The world of work is also set to change dramatically. Many jobs that are currently performed by humans could be automated, potentially leading to widespread unemployment in some industries. On the other hand, AI is also likely to create new jobs that we cannot yet imagine. The key will be ensuring that people have the skills and training they need to adapt to the changing job market. Governments and educational institutions will need to work together to provide opportunities for lifelong learning.</p>
<p>There are also important ethical questions to consider. As AI systems become more intelligent, who will be responsible when things go wrong? How can we ensure that AI is used in ways that benefit society as a whole? These are questions that policymakers, researchers and the general public will need to address in the coming years. It is important that the development of AI is guided by clear ethical principles.</p>
<p>Despite the challenges, there is no doubt that AI will continue to shape our future in ways that we can only begin to imagine. The key will be ensuring that this powerful technology is developed and used responsibly, for the benefit of all humanity.</p>`;

export const MOCK_READING_TEST: IReadingTest = {
  id: 'mock-c19-test1',
  source: 'mock',
  title: 'C19 Test 1 · 阅读',
  totalTime: 3600,
  passages: [
    {
      index: 1,
      title: 'How tennis rackets have changed',
      content: passage1Content,
      suggestedTime: 20,
      questionRange: 'Questions 1-13',
    },
    {
      index: 2,
      title: 'The history of the calendar',
      content: passage2Content,
      suggestedTime: 20,
      questionRange: 'Questions 14-26',
    },
    {
      index: 3,
      title: 'The future of artificial intelligence',
      content: passage3Content,
      suggestedTime: 20,
      questionRange: 'Questions 27-40',
    },
  ],
  questions: [
    // Passage 1 - True/False/Not Given (Q1-7)
    {
      id: 'q1',
      number: 1,
      passageIndex: 1,
      type: 'true_false_not_given',
      groupInstruction:
        'Do the following statements agree with the information given in Reading Passage 1?\nChoose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
      groupRange: 'Questions 1-7',
      questionText:
        "People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.",
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'FALSE',
      isAnswered: false,
    },
    {
      id: 'q2',
      number: 2,
      passageIndex: 1,
      type: 'true_false_not_given',
      questionText:
        'The change that Andy Murray made to his rackets attracted a lot of attention.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'FALSE',
      isAnswered: false,
    },
    {
      id: 'q3',
      number: 3,
      passageIndex: 1,
      type: 'true_false_not_given',
      questionText:
        "Murray's use of synthetic string for the crosses was a significant factor in his improvement.",
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'NOT GIVEN',
      isAnswered: false,
    },
    {
      id: 'q4',
      number: 4,
      passageIndex: 1,
      type: 'true_false_not_given',
      questionText:
        'Professional tennis players can easily buy the same rackets that are used by top players.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'FALSE',
      isAnswered: false,
    },
    {
      id: 'q5',
      number: 5,
      passageIndex: 1,
      type: 'true_false_not_given',
      questionText:
        'The Bryan brothers have had the weight of their rackets increased.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'TRUE',
      isAnswered: false,
    },
    {
      id: 'q6',
      number: 6,
      passageIndex: 1,
      type: 'true_false_not_given',
      questionText:
        'Top players often notice if their racket has not been strung correctly.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'TRUE',
      isAnswered: false,
    },
    {
      id: 'q7',
      number: 7,
      passageIndex: 1,
      type: 'true_false_not_given',
      questionText:
        'Polyester strings were first introduced in the year 2000.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'NOT GIVEN',
      isAnswered: false,
    },
    // Passage 1 - Multiple choice single (Q8-10)
    {
      id: 'q8',
      number: 8,
      passageIndex: 1,
      type: 'multiple_choice_single',
      groupInstruction:
        'Choose the correct letter, A, B, C or D.',
      groupRange: 'Questions 8-10',
      questionText: 'What does the writer say about the change in Murray\'s coaching team?',
      options: [
        'It was the main reason for his success.',
        'It received a lot of media attention.',
        'It was suggested by Ivan Lendl.',
        'It had a greater impact than his string change.',
      ],
      correctAnswer: 'B',
      isAnswered: false,
    },
    {
      id: 'q9',
      number: 9,
      passageIndex: 1,
      type: 'multiple_choice_single',
      questionText: 'Colin Triplow says that customised rackets are',
      options: [
        'becoming more popular with amateur players.',
        'essential for all professional players.',
        'an important part of improving performance.',
        'less important than good coaching.',
      ],
      correctAnswer: 'C',
      isAnswered: false,
    },
    {
      id: 'q10',
      number: 10,
      passageIndex: 1,
      type: 'multiple_choice_single',
      questionText: 'According to the text, what has been a major development since 2000?',
      options: [
        'The use of lighter racket frames.',
        'An increase in the variety of strings available.',
        'The introduction of natural strings.',
        'A reduction in the price of professional rackets.',
      ],
      correctAnswer: 'B',
      isAnswered: false,
    },
    // Passage 1 - Summary fill blank (Q11-13)
    {
      id: 'q11',
      number: 11,
      passageIndex: 1,
      type: 'fill_blank_summary',
      groupInstruction:
        'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      groupRange: 'Questions 11-13',
      questionText:
        'Even when rackets are supposedly identical, small differences can be significant. For example, the 11. __________ of the strings can vary by up to five pounds. Players are very 12. __________ to such differences. For most players, 13. __________ is more important than having a perfect racket.',
      blanks: 3,
      correctAnswer: ['tension', 'sensitive', 'consistency'],
      isAnswered: false,
    },
    // Passage 2 - Matching headings (Q14-18)
    {
      id: 'q14',
      number: 14,
      passageIndex: 2,
      type: 'matching_heading',
      groupInstruction:
        'Reading Passage 2 has six paragraphs, A-F. Choose the correct heading for each paragraph from the list of headings below.',
      groupRange: 'Questions 14-18',
      questionText: 'Paragraph A',
      options: [
        'A solution that worked for a long time',
        'The earliest known calendar system',
        'Why the first solar calendar was imperfect',
        'The calendar of ancient Egypt',
        'Two important changes',
        'A slow process of adoption',
      ],
      correctAnswer: 'iv',
      isAnswered: false,
    },
    {
      id: 'q15',
      number: 15,
      passageIndex: 2,
      type: 'matching_heading',
      questionText: 'Paragraph B',
      options: [
        'A solution that worked for a long time',
        'The earliest known calendar system',
        'Why the first solar calendar was imperfect',
        'The calendar of ancient Egypt',
        'Two important changes',
        'A slow process of adoption',
      ],
      correctAnswer: 'i',
      isAnswered: false,
    },
    {
      id: 'q16',
      number: 16,
      passageIndex: 2,
      type: 'matching_heading',
      questionText: 'Paragraph C',
      options: [
        'A solution that worked for a long time',
        'The earliest known calendar system',
        'Why the first solar calendar was imperfect',
        'The calendar of ancient Egypt',
        'Two important changes',
        'A slow process of adoption',
      ],
      correctAnswer: 'v',
      isAnswered: false,
    },
    {
      id: 'q17',
      number: 17,
      passageIndex: 2,
      type: 'matching_heading',
      questionText: 'Paragraph D',
      options: [
        'A solution that worked for a long time',
        'The earliest known calendar system',
        'Why the first solar calendar was imperfect',
        'The calendar of ancient Egypt',
        'Two important changes',
        'A slow process of adoption',
      ],
      correctAnswer: 'vi',
      isAnswered: false,
    },
    {
      id: 'q18',
      number: 18,
      passageIndex: 2,
      type: 'matching_heading',
      questionText: 'Paragraph E',
      options: [
        'Alternative calendar systems',
        'The earliest known calendar system',
        'Why the first solar calendar was imperfect',
        'The calendar of ancient Egypt',
        'Two important changes',
        'A slow process of adoption',
      ],
      correctAnswer: 'i',
      isAnswered: false,
    },
    // Passage 2 - True/False/Not Given (Q19-22)
    {
      id: 'q19',
      number: 19,
      passageIndex: 2,
      type: 'true_false_not_given',
      groupInstruction:
        'Do the following statements agree with the information given in Reading Passage 2?',
      groupRange: 'Questions 19-22',
      questionText:
        'The Egyptian calendar had 365 days divided equally into 12 months.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'FALSE',
      isAnswered: false,
    },
    {
      id: 'q20',
      number: 20,
      passageIndex: 2,
      type: 'true_false_not_given',
      questionText:
        'The Julian calendar was more accurate than the Egyptian calendar.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'TRUE',
      isAnswered: false,
    },
    {
      id: 'q21',
      number: 21,
      passageIndex: 2,
      type: 'true_false_not_given',
      questionText:
        'All European countries adopted the Gregorian calendar in the 16th century.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'FALSE',
      isAnswered: false,
    },
    {
      id: 'q22',
      number: 22,
      passageIndex: 2,
      type: 'true_false_not_given',
      questionText:
        'The Islamic calendar is shorter than the Chinese calendar.',
      options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      correctAnswer: 'NOT GIVEN',
      isAnswered: false,
    },
    // Passage 2 - Fill in blanks (Q23-26)
    {
      id: 'q23',
      number: 23,
      passageIndex: 2,
      type: 'fill_blank_sentence',
      groupInstruction:
        'Complete the sentences below. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
      groupRange: 'Questions 23-26',
      questionText:
        'The Gregorian calendar was introduced by Pope Gregory XIII in the year __________.',
      correctAnswer: '1582',
      isAnswered: false,
    },
    {
      id: 'q24',
      number: 24,
      passageIndex: 2,
      type: 'fill_blank_sentence',
      questionText:
        'Britain switched to the Gregorian calendar in __________.',
      correctAnswer: '1752',
      isAnswered: false,
    },
    {
      id: 'q25',
      number: 25,
      passageIndex: 2,
      type: 'fill_blank_sentence',
      questionText:
        'The Chinese calendar is an example of a __________ calendar.',
      correctAnswer: 'lunisolar',
      isAnswered: false,
    },
    {
      id: 'q26',
      number: 26,
      passageIndex: 2,
      type: 'fill_blank_sentence',
      questionText:
        'Islamic holidays shift by about __________ each year relative to the Gregorian calendar.',
      correctAnswer: '11 days',
      isAnswered: false,
    },
    // Passage 3 - Multiple choice multi (Q27-28)
    {
      id: 'q27',
      number: 27,
      passageIndex: 3,
      type: 'multiple_choice_multi',
      groupInstruction:
        'Choose TWO letters, A-E.',
      groupRange: 'Questions 27-28',
      questionText:
        'Which TWO of the following are mentioned as areas where AI could have a significant impact?',
      options: [
        'Healthcare',
        'Transportation',
        'Education',
        'Entertainment',
        'Agriculture',
      ],
      correctAnswer: ['A', 'C'],
      isAnswered: false,
    },
    // Passage 3 - Matching information (Q29-33)
    {
      id: 'q29',
      number: 29,
      passageIndex: 3,
      type: 'matching_information',
      groupInstruction:
        'Reading Passage 3 has six paragraphs, A-F. Which paragraph contains the following information? You may use any letter more than once.',
      groupRange: 'Questions 29-33',
      questionText:
        'A description of how AI could affect the job market',
      options: ['A', 'B', 'C', 'D', 'E', 'F'],
      correctAnswer: 'D',
      isAnswered: false,
    },
    {
      id: 'q30',
      number: 30,
      passageIndex: 3,
      type: 'matching_information',
      questionText:
        'An example of how AI can analyse visual data',
      options: ['A', 'B', 'C', 'D', 'E', 'F'],
      correctAnswer: 'B',
      isAnswered: false,
    },
    {
      id: 'q31',
      number: 31,
      passageIndex: 3,
      type: 'matching_information',
      questionText:
        'Concerns about the ethical use of AI',
      options: ['A', 'B', 'C', 'D', 'E', 'F'],
      correctAnswer: 'E',
      isAnswered: false,
    },
    {
      id: 'q32',
      number: 32,
      passageIndex: 3,
      type: 'matching_information',
      questionText:
        'The potential for personalised learning',
      options: ['A', 'B', 'C', 'D', 'E', 'F'],
      correctAnswer: 'C',
      isAnswered: false,
    },
    {
      id: 'q33',
      number: 33,
      passageIndex: 3,
      type: 'matching_information',
      questionText:
        'A question about the future speed of AI development',
      options: ['A', 'B', 'C', 'D', 'E', 'F'],
      correctAnswer: 'A',
      isAnswered: false,
    },
    // Passage 3 - Summary fill blank (Q34-40)
    {
      id: 'q34',
      number: 34,
      passageIndex: 3,
      type: 'fill_blank_summary',
      groupInstruction:
        'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      groupRange: 'Questions 34-40',
      questionText:
        'Artificial intelligence is already changing our lives in many ways. In the future, AI may be able to 34. __________ diseases earlier, potentially saving many lives. In education, AI could provide 35. __________ education tailored to each student\'s needs. However, there are concerns that too much 36. __________ on AI could reduce the importance of human interaction. In the workplace, many jobs could be 37. __________, which may lead to unemployment. At the same time, AI is also likely to create new 38. __________. There are also important 39. __________ questions about the responsibility for AI decisions. Despite the challenges, AI will undoubtedly continue to shape our 40. __________.',
      blanks: 7,
      correctAnswer: ['diagnose', 'personalised', 'reliance', 'automated', 'jobs', 'ethical', 'future'],
      isAnswered: false,
    },
  ],
};
