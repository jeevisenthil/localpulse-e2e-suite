// LocalPulse Design System — Premium dark theme with vibrant accents

export const Colors = {
  // Primary palette
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryFaded: 'rgba(99, 102, 241, 0.12)',

  // Accent
  accent: '#06b6d4',
  accentLight: '#22d3ee',
  accentFaded: 'rgba(6, 182, 212, 0.12)',

  // Backgrounds
  bgDark: '#0f172a',
  bgCard: '#1e293b',
  bgCardHover: '#253449',
  bgElevated: '#293548',
  bgInput: '#1a2536',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textFaint: '#475569',

  // Borders
  border: '#334155',
  borderLight: '#3b4d65',
  borderFocus: '#6366f1',

  // Status
  urgent: '#ef4444',
  urgentBg: 'rgba(239, 68, 68, 0.12)',
  urgentLight: '#fca5a5',

  important: '#f59e0b',
  importantBg: 'rgba(245, 158, 11, 0.12)',
  importantLight: '#fcd34d',

  normal: '#10b981',
  normalBg: 'rgba(16, 185, 129, 0.12)',
  normalLight: '#6ee7b7',

  // Category badge colors
  power: { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5' },
  water: { bg: 'rgba(56, 189, 248, 0.15)', text: '#7dd3fc' },
  event: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c4b5fd' },
  lost: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fcd34d' },
  jobs: { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7' },
  general: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' },
  emergency: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
  security: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fcd34d' },

  // Misc
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  success: '#10b981',
  error: '#ef4444',
  star: '#fbbf24',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 34,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  round: 50,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};
