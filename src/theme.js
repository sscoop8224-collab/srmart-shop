// ── 색상 토큰 ────────────────────────────────────────────────
export const colors = {
  // Green scale
  green50:  '#f0faf5',
  green100: '#e8faf3',
  green200: '#c8f0df',
  green300: '#00c471',  // primary
  green400: '#00a85e',  // primary dark
  green500: '#008a4e',
  green700: '#0d4d2a',  // dark mode header
  green800: '#083d20',

  // Gray scale (light mode)
  gray50:  '#f8f9fa',
  gray100: '#f1f3f5',
  gray200: '#e9ecef',
  gray300: '#dee2e6',
  gray400: '#ced4da',
  gray500: '#adb5bd',
  gray600: '#868e96',
  gray700: '#495057',
  gray800: '#343a40',
  gray900: '#212529',

  // Dark scale
  dark900: '#111111',
  dark800: '#161616',
  dark700: '#1a1a1a',
  dark600: '#1e1e1e',
  dark500: '#222222',
  dark400: '#242424',
  dark300: '#2a2a2a',
  dark200: '#2e2e2e',
  dark100: '#333333',
  dark50:  '#3a3a3a',

  // Semantic
  danger:       '#ff4757',
  dangerDark:   '#c62828',
  dangerLight:  '#fff0f1',
  warning:      '#f0a500',
  warningLight: '#fff3cd',
  info:         '#1a73e8',
  infoLight:    '#e8f0fe',
  success:      '#00c471',

  white: '#ffffff',
  black: '#000000',
};

// ── 다크/라이트 테마 매핑 ────────────────────────────────────
export const getTheme = (dark) => ({
  bg:          dark ? colors.dark700 : colors.gray50,
  surface:     dark ? colors.dark300 : colors.white,
  surfaceAlt:  dark ? colors.dark400 : colors.gray50,
  surfaceHover:dark ? colors.dark200 : colors.gray100,
  border:      dark ? colors.dark50  : colors.gray200,
  borderLight: dark ? colors.dark100 : colors.green100,
  text:        dark ? '#f0f0f0'      : colors.gray900,
  textSub:     dark ? '#9e9e9e'      : colors.gray500,
  textMuted:   dark ? '#6e6e6e'      : colors.gray400,
  primary:     colors.green300,
  primaryDark: colors.green400,
  inputBg:     dark ? colors.dark600 : colors.white,
  inputBorder: dark ? colors.dark50  : colors.green100,
  cardShadow:  dark ? 'none'         : '0 2px 12px rgba(0,0,0,0.06)',
  headerBg:    dark ? colors.dark500 : colors.white,
  headerBorder:dark ? colors.dark50  : colors.green50,
  dangerBg:    dark ? '#3a1a1a'      : colors.dangerLight,
  dangerText:  dark ? '#ff9999'      : colors.danger,
  infoBg:      dark ? '#1a2a40'      : colors.infoLight,
  infoText:    colors.info,
});

// ── 간격(spacing) ────────────────────────────────────────────
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

// ── 보더 반경(radius) ────────────────────────────────────────
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 9999,
};

// ── 그림자(shadow) ───────────────────────────────────────────
export const shadow = {
  none:  'none',
  sm:    '0 1px 4px rgba(0,0,0,0.06)',
  md:    '0 2px 12px rgba(0,0,0,0.08)',
  lg:    '0 4px 24px rgba(0,0,0,0.12)',
  green: '0 4px 16px rgba(0,196,113,0.30)',
  card:  '0 2px 8px rgba(0,0,0,0.05)',
};

// ── 폰트 크기(fontSize) ──────────────────────────────────────
export const fontSize = {
  xs:   10,
  sm:   11,
  md:   13,
  base: 14,
  lg:   16,
  xl:   18,
  xxl:  22,
  xxxl: 28,
};
