import { hasKey, useT } from '@/i18n';
import { useSession } from './session-store';
import * as S from './session';

/** The Reach-out message: her edited text, or the composed one (m_hi + m_body + m_<need>). */
export function useMsgText() {
  const { t, lang } = useT();
  const s = useSession((x) => x.s);
  if (!s) return '';
  return s.msg.text != null ? s.msg.text : S.compose(s, lang, t, (k) => hasKey(k, lang));
}
