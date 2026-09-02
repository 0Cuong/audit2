export interface ZodiacSign {
  name: string;
  symbol: string;
  dates: string;
  element: string;
  traits: string[];
}

export const zodiacSigns: ZodiacSign[] = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire', traits: ['Bold', 'Ambitious', 'Energetic'] },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth', traits: ['Reliable', 'Patient', 'Devoted'] },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air', traits: ['Adaptable', 'Curious', 'Witty'] },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water', traits: ['Intuitive', 'Caring', 'Protective'] },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire', traits: ['Charismatic', 'Generous', 'Confident'] },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth', traits: ['Analytical', 'Kind', 'Hardworking'] },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air', traits: ['Diplomatic', 'Harmonious', 'Social'] },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water', traits: ['Passionate', 'Resourceful', 'Brave'] },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire', traits: ['Adventurous', 'Optimistic', 'Free'] },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth', traits: ['Disciplined', 'Responsible', 'Wise'] },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air', traits: ['Progressive', 'Independent', 'Humanitarian'] },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water', traits: ['Compassionate', 'Artistic', 'Intuitive'] },
];

export function getZodiacFromDate(dateStr: string | null | undefined): ZodiacSign | null {
  if (!dateStr) return null;

  // Safe parsing of month and day from string (YYYY-MM-DD or ISO) without UTC timezone drift
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return null;

  const m = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(m) || isNaN(day)) return null;

  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return zodiacSigns[0]; // Aries
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return zodiacSigns[1]; // Taurus
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return zodiacSigns[2]; // Gemini
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return zodiacSigns[3]; // Cancer
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return zodiacSigns[4]; // Leo
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return zodiacSigns[5]; // Virgo
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return zodiacSigns[6]; // Libra
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return zodiacSigns[7]; // Scorpio
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return zodiacSigns[8]; // Sagittarius
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return zodiacSigns[9]; // Capricorn
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return zodiacSigns[10]; // Aquarius
  if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return zodiacSigns[11]; // Pisces

  return zodiacSigns[9];
}

type CompatibilityKey = `${string}-${string}`;

export const compatibilityData: Record<CompatibilityKey, { score: number; strengths: string[]; challenges: string[]; communication: string; loveLanguage: string }> = {
  'Aries-Leo': { score: 95, strengths: ['Passionate chemistry', 'Shared ambition', 'Mutual admiration'], challenges: ['Both want to lead', 'Stubborn clashes'], communication: 'Direct and enthusiastic, no holding back', loveLanguage: 'Words of Affirmation + Physical Touch' },
  'Aries-Gemini': { score: 83, strengths: ['Electric energy', 'Endless conversation', 'Spontaneous adventures'], challenges: ['Restless nature', 'Commitment fears'], communication: 'Fast-paced, witty banter', loveLanguage: 'Quality Time + Words of Affirmation' },
  'Taurus-Cancer': { score: 97, strengths: ['Deep emotional bond', 'Shared values', 'Home and family focus'], challenges: ['Possessiveness', 'Mood swings'], communication: 'Gentle, nurturing, and consistent', loveLanguage: 'Physical Touch + Acts of Service' },
  'Taurus-Virgo': { score: 92, strengths: ['Practical teamwork', 'Shared appreciation for quality', 'Loyalty'], challenges: ['Over-critical tendencies', 'Resistance to change'], communication: 'Practical, detail-oriented, constructive', loveLanguage: 'Acts of Service + Quality Time' },
  'Gemini-Libra': { score: 88, strengths: ['Intellectual stimulation', 'Social harmony', 'Endless curiosity'], challenges: ['Indecision', 'Surface-level avoidance'], communication: 'Elegant, balanced, and intellectually engaging', loveLanguage: 'Words of Affirmation + Quality Time' },
  'Cancer-Scorpio': { score: 98, strengths: ['Profound emotional depth', 'Intuitive understanding', 'Unbreakable loyalty'], challenges: ['Jealousy', 'Emotional intensity'], communication: 'Deep, empathetic, emotionally resonant', loveLanguage: 'Quality Time + Physical Touch' },
  'Cancer-Pisces': { score: 96, strengths: ['Emotional synergy', 'Creative imagination', 'Spiritual connection'], challenges: ['Escapism', 'Boundary issues'], communication: 'Intuitive, poetic, and compassionate', loveLanguage: 'Quality Time + Acts of Service' },
  'Leo-Sagittarius': { score: 93, strengths: ['Adventurous spirit', 'Mutual optimism', 'Generous love'], challenges: ['Over-confidence', 'Need for independence'], communication: 'Bold, enthusiastic, and expansive', loveLanguage: 'Words of Affirmation + Gifts' },
  'Virgo-Capricorn': { score: 94, strengths: ['Shared ambition', 'Practical approach', 'Devoted partnership'], challenges: ['Emotional reservation', 'Work-life balance'], communication: 'Structured, supportive, and reliable', loveLanguage: 'Acts of Service + Quality Time' },
  'Libra-Aquarius': { score: 85, strengths: ['Mental connection', 'Social awareness', 'Innovative ideas'], challenges: ['Emotional distance', 'Detachment'], communication: 'Intellectual, progressive, and fair', loveLanguage: 'Quality Time + Words of Affirmation' },
  'Scorpio-Pisces': { score: 97, strengths: ['Magnetic attraction', 'Emotional depth', 'Spiritual unity'], challenges: ['Manipulation risk', 'Enmeshment'], communication: 'Intense, psychic, and deeply intimate', loveLanguage: 'Physical Touch + Quality Time' },
  'Sagittarius-Aquarius': { score: 86, strengths: ['Freedom lovers', 'Philosophical depth', 'Shared adventures'], challenges: ['Commitment reluctance', 'Emotional distance'], communication: 'Free, philosophical, and visionary', loveLanguage: 'Quality Time + Words of Affirmation' },
  'Capricorn-Taurus': { score: 96, strengths: ['Stable foundation', 'Shared goals', 'Enduring commitment'], challenges: ['Rigidity', 'Emotional suppression'], communication: 'Practical, steady, and dependable', loveLanguage: 'Acts of Service + Physical Touch' },
  'Aquarius-Gemini': { score: 84, strengths: ['Mental rapport', 'Innovative ideas', 'Independence respect'], challenges: ['Emotional distance', 'Unpredictability'], communication: 'Intellectual, unconventional, and stimulating', loveLanguage: 'Words of Affirmation + Quality Time' },
  'Pisces-Taurus': { score: 90, strengths: ['Dreamy romance', 'Artistic synergy', 'Emotional security'], challenges: ['Escapism vs. practicality', 'Pace mismatch'], communication: 'Gentle, romantic, and creative', loveLanguage: 'Quality Time + Physical Touch' },
  'Aries-Libra': { score: 78, strengths: ['Balance of action and harmony', 'Complementary energies', 'Social magnetism'], challenges: ['Impatience vs. indecision', 'Conflict styles'], communication: 'Direct but diplomatic, finding middle ground', loveLanguage: 'Physical Touch + Words of Affirmation' },
  'Leo-Aquarius': { score: 80, strengths: ['Individual expression', 'Shared vision', 'Mutual respect'], challenges: ['Ego clashes', 'Emotional detachment'], communication: 'Dramatic yet progressive, inspiring each other', loveLanguage: 'Words of Affirmation + Gifts' },
  'Virgo-Pisces': { score: 91, strengths: ['Healing connection', 'Complementary strengths', 'Spiritual growth'], challenges: ['Practical vs. dreamy', 'Critical tendencies'], communication: 'Gentle, supportive, and understanding', loveLanguage: 'Acts of Service + Quality Time' },
  'Gemini-Sagittarius': { score: 82, strengths: ['Intellectual adventure', 'Shared curiosity', 'Humor'], challenges: ['Restlessness', 'Depth vs. breadth'], communication: 'Fast, fun, and exploratory', loveLanguage: 'Quality Time + Words of Affirmation' },
  'Cancer-Virgo': { score: 89, strengths: ['Nurturing bond', 'Practical care', 'Loyalty'], challenges: ['Worry spiral', 'Over-accommodation'], communication: 'Caring, attentive, and detail-oriented', loveLanguage: 'Acts of Service + Quality Time' },
  'Scorpio-Capricorn': { score: 88, strengths: ['Ambitious power couple', 'Deep respect', 'Enduring commitment'], challenges: ['Control issues', 'Emotional reservation'], communication: 'Strategic, intense, and purposeful', loveLanguage: 'Physical Touch + Acts of Service' },
  'Taurus-Scorpio': { score: 89, strengths: ['Intense magnetism', 'Loyalty', 'Sensual connection'], challenges: ['Stubbornness', 'Jealousy'], communication: 'Deep, committed, and passionate', loveLanguage: 'Physical Touch + Quality Time' },
  'Aries-Cancer': { score: 72, strengths: ['Protective dynamic', 'Complementary energy'], challenges: ['Aggression vs. sensitivity', 'Different paces'], communication: 'Needs gentle bridging between direct and emotional', loveLanguage: 'Physical Touch + Quality Time' },
  'Leo-Scorpio': { score: 75, strengths: ['Powerful magnetism', 'Intense passion'], challenges: ['Both want control', 'Jealousy'], communication: 'Intense, passionate, needs mutual respect', loveLanguage: 'Physical Touch + Words of Affirmation' },
  'Virgo-Virgo': { score: 88, strengths: ['Mutual understanding', 'Order and harmony', 'Attention to detail'], challenges: ['Overthinking', 'Criticism spirals'], communication: 'Thoughtful, precise, and supportive', loveLanguage: 'Acts of Service + Quality Time' },
  'Capricorn-Capricorn': { score: 90, strengths: ['Shared work ethic', 'Unwavering loyalty', 'Long-term vision'], challenges: ['Overworking', 'Reserved emotional expression'], communication: 'Honest, steady, and purposeful', loveLanguage: 'Acts of Service + Physical Touch' },
};

export function getCompatibility(sign1: string, sign2: string) {
  const key1: CompatibilityKey = `${sign1}-${sign2}`;
  const key2: CompatibilityKey = `${sign2}-${sign1}`;
  return compatibilityData[key1] || compatibilityData[key2] || {
    score: 85,
    strengths: ['Growth potential', 'Learning from differences', 'Unique connection'],
    challenges: ['Different approaches', 'Communication adjustment needed'],
    communication: 'Finding your own rhythm together',
    loveLanguage: 'Discovering each other\'s love language',
  };
}

export const dailyQuestions = [
  "Điều gì đã khiến bạn mỉm cười nhiều nhất hôm nay?",
  "Khoảnh khắc nào bên nhau làm bạn cảm thấy bình yên nhất?",
  "Nếu ngày mai được đi bất cứ đâu cùng nhau, bạn muốn đến đâu?",
  "Một ước mơ nhỏ cho tương lai của hai đứa mà bạn luôn ấp ủ là gì?",
  "Kỷ niệm nào của chúng mình làm bạn nhớ mãi?",
  "Bài hát nào mỗi khi vang lên đều làm bạn nhớ đến người ấy?",
  "Điều gì mới mẻ mà bạn muốn hai đứa cùng thử trải nghiệm?",
  "Lúc nào bạn cảm thấy được yêu thương và chở che nhất?",
  "Một điều ở đối phương mà bạn vô cùng trân quý là gì?",
  "Một ngày trọn vẹn hoàn hảo của hai đứa sẽ diễn ra như thế nào?",
  "Mục tiêu lớn tiếp theo mà bạn muốn cùng nhau đạt được là gì?",
  "Điều gì ở tình yêu này làm bạn cảm thấy bất ngờ và hạnh phúc nhất?",
  "Thói quen nhỏ nào bạn muốn tụi mình duy trì mãi mãi?",
  "Từ ngày bên nhau, bạn thấy bản thân đã thay đổi tích cực như thế nào?",
  "Chuyến đi phượt/du lịch tiếp theo tụi mình nên lên kế hoạch đi đâu?",
];
