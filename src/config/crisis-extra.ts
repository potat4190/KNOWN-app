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
 */
export const CRISIS_EXTRA_STATUS: 'drafted' | 'approved' = 'drafted';

export const CRISIS_EXTRA =
  /(ending my life|end it all|take my (own )?life|hurting myself|threaten(ing|ed)? (me|to kill)|going to kill me|想死|不想活|轻生|伤害自己|结束(自己的)?生命|威胁我|生きていたくない|自分を傷つけ|命を終わらせ|脅され|ဆက်မနေချင်|ကိုယ့်ကိုယ်ကို နာကျင်|အသက်ကို အဆုံးသတ်|ခြိမ်းခြောက်|إنهاء حياتي|يهددني|سيقتلني)/i;
