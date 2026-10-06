/** Transient UI state: which sheet is open, the status line, AI activity (panel). Never persisted. */
import { create } from 'zustand';
import { AccessibilityInfo } from 'react-native';

export type SheetName = 'exit' | 'nofit' | 'recover' | 'clear' | null;

export type AiLogEntry = {
  kind: 'match' | 'translate' | 'lines';
  source: string;
  ms: number;
  input: string;
  output?: unknown;
  error?: string;
  at: number;
};

type UiState = {
  sheet: SheetName;
  status: string;
  aiLog: AiLogEntry[];
  /** Last Scripture source used (panel → YouVersion section). */
  lastScripture: { source: string; versionId: number | null; error: string | null } | null;
  openSheet: (s: SheetName) => void;
  closeSheet: () => void;
  /** A status line, announced to screen readers. */
  say: (msg: string) => void;
  logAi: (e: Omit<AiLogEntry, 'at'>) => void;
};

export const useUi = create<UiState>((set) => ({
  sheet: null,
  status: '',
  aiLog: [],
  lastScripture: null,
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
  say: (status) => {
    set({ status });
    if (status) AccessibilityInfo.announceForAccessibility(status);
  },
  logAi: (e) => set((s) => ({ aiLog: [{ ...e, at: Date.now() }, ...s.aiLog].slice(0, 6) })),
}));
