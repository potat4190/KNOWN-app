/**
 * Every Help number and link lives here, never inline in a screen.
 *
 * An entry is shown as a specific number only once it has BOTH verifiedBy and
 * verifiedOn (YYYY-MM-DD). Kezia fills these after checking each number
 * against the provider's own site. Studies have found wrong numbers in about
 * 9% of suicide-prevention apps, so we never guess.
 *
 * scripts/validate-content.ts reports entries missing either field, and fails
 * the production variant.
 */
export type HelpLineKind = 'tel' | 'sms' | 'url';

export type HelpLine = {
  id: string;
  kind: HelpLineKind;
  value: string;
  /** 'world', or an ISO 3166-1 alpha-2 region code such as 'US'. */
  region: string;
  verifiedBy: string;
  verifiedOn: string;
};

/** Items 1 and 3 on the Help screen. Order is the safety floor; keep it. */
export const HELP_LINES = {
  findahelpline: {
    id: 'findahelpline',
    kind: 'url',
    value: 'https://findahelpline.com',
    region: 'world',
    verifiedBy: '',
    verifiedOn: '',
  },
  us988Call: { id: 'us-988-call', kind: 'tel', value: '988', region: 'US', verifiedBy: '', verifiedOn: '' },
  us988Text: { id: 'us-988-text', kind: 'sms', value: '988', region: 'US', verifiedBy: '', verifiedOn: '' },
  us911: { id: 'us-911', kind: 'tel', value: '911', region: 'US', verifiedBy: '', verifiedOn: '' },
} satisfies Record<string, HelpLine>;

/**
 * Item 2, "Your local emergency number", set to her country.
 * If expo-localization's region matches a VERIFIED entry, its number is shown;
 * otherwise the generic text is shown. Add a country only after checking it.
 */
export const LOCAL_EMERGENCY: HelpLine[] = [
  { id: 'local-us', kind: 'tel', value: '911', region: 'US', verifiedBy: '', verifiedOn: '' },
];

export const ALL_HELP_LINES: HelpLine[] = [...Object.values(HELP_LINES), ...LOCAL_EMERGENCY];

export const isVerified = (l: HelpLine) => Boolean(l.verifiedBy.trim() && /^\d{4}-\d{2}-\d{2}$/.test(l.verifiedOn));

/** The verified local emergency line for a region, or null (show the generic text). */
export function localEmergencyFor(region: string | null | undefined): HelpLine | null {
  if (!region) return null;
  const hit = LOCAL_EMERGENCY.find((l) => l.region === region.toUpperCase());
  return hit && isVerified(hit) ? hit : null;
}
