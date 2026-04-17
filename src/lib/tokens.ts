export const colors = {
  // Brand primary — Rippling AI purple
  primary:      '#7A005D',
  primaryDark:  '#5A0044',
  primaryDeep:  '#3D002E',
  primaryLight: '#F5E6F1',
  primaryMid:   '#EAD0E8',
  primaryGlow:  'rgba(122,0,93,0.18)',

  // Neutrals
  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray150: '#eceef1',
  gray200: '#e1e5eb',
  gray300: '#cdd3db',
  gray400: '#9aa5b4',
  gray500: '#6b7a90',
  gray600: '#4d5967',
  gray700: '#3a4554',
  gray900: '#111827',

  white: '#ffffff',
  black: '#000000',

  // Semantic
  success:      '#10b981',
  successLight: '#d1fae5',
  warning:      '#f59e0b',
  error:        '#ef4444',
} as const;

export const spacing = {
  xs:   '4px',
  sm:   '8px',
  md:   '16px',
  lg:   '24px',
  xl:   '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const radii = {
  sm:   '6px',
  md:   '10px',
  lg:   '16px',
  xl:   '24px',
  full: '9999px',
} as const;

export const shadows = {
  sm:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  md:      '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  lg:      '0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05)',
  xl:      '0 24px 64px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.07)',
  primary: '0 6px 24px rgba(122,0,93,0.28)',
  glow:    '0 0 40px rgba(122,0,93,0.2)',
} as const;
