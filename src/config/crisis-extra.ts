/**
 * DRAFTED supplementary crisis phrases, for Kezia's safeguarding review.
 *
 * The reviewed regex from the Design Lab (src/content/crisis.ts) missed 18 of
 * the 25 crisis test phrases in relay/test-set.jsonl (for example 我想死,
 * もう生きていたくない, "ending my life", and threats from another person).
 * These patterns are OR'd with it on the phone, before any AI call. A false
 * positive only shows the Crisis screen first (she can still continue to
 * Scripture); a miss could skip it. Kezia: approve, edit or remove, then set
 * status to 'approved'.
 *
 * Added 2026-10-04 (also drafted): "I don't want to be here anymore", "I can't
 * go on", "nobody would miss me", "I want to disappear", which skipped the
 * Crisis screen when no relay is set. Everyday uses ("I can't go on the trip",
 * "disappear from social media") are left out on purpose. Other languages
 * probably need the same phrases (e.g. 消えたい, 我想消失): for Kezia.
 */
export const CRISIS_EXTRA_STATUS: 'drafted' | 'approved' = 'drafted';

const APOS = "['’]?";

const PHRASES = [
  'ending my life',
  'end it all',
  'take my (own )?life',
  'hurting myself',
  'threaten(ing|ed)? (me|to kill)',
  'going to kill me',
  `do(n${APOS}t| not) want to be here any ?more`,
  `(can${APOS}t|cannot|can not) go on\\b(?!\\s+(the|a|an|my|our|this|that|with|to|holiday|holidays|trip|vacation|stage|line|tv|social)\\b)`,
  `(nobody|no ?one|no-one)( would| will|${APOS}d)( even)? (miss me|notice if i|care if i)`,
  'want(ed)? to (just )?disappear(?!\\s+(from|for a)\\b)',
  '想死',
  '不想活',
  '轻生',
  '伤害自己',
  '结束(自己的)?生命',
  '威胁我',
  '生きていたくない',
  '自分を傷つけ',
  '命を終わらせ',
  '脅され',
  'ဆက်မနေချင်',
  'ကိုယ့်ကိုယ်ကို နာကျင်',
  'အသက်ကို အဆုံးသတ်',
  'ခြိမ်းခြောက်',
  'إنهاء حياتي',
  'يهددني',
  'سيقتلني',
];

export const CRISIS_EXTRA = new RegExp(`(${PHRASES.join('|')})`, 'i');
