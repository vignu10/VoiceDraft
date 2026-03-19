/**
 * VoiceScribe Design System
 * Arc Browser-inspired: soft pastels, playful gradients, unique personality
 * Warm, cozy, refined - not generic tech
 */

// ============================================
// COLOR PALETTE - Soft Pastels & Warm Tones
// ============================================
export const Palette = {
  // Periwinkle/Lavender - Primary brand
  periwinkle: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  // Soft Pink/Coral - Warm accent
  coral: {
    50: '#FFF5F5',
    100: '#FFE8E8',
    200: '#FFCCD2',
    300: '#FFA8B4',
    400: '#F87F94',
    500: '#EC5D72',
    600: '#D9415A',
    700: '#B82E45',
    800: '#9A2339',
    900: '#7F1D30',
  },
  // Soft Teal - Secondary cool accent
  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  // Warm Neutrals (slightly pink/lavender-tinted)
  neutral: {
    50: '#FAFAF9',
    100: '#F5F4F3',
    200: '#ECEAE8',
    300: '#DBD8D5',
    400: '#ABA7A2',
    500: '#7C7872',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
    950: '#0C0A09',
  },
  // Pure
  black: '#000000',
  white: '#FFFFFF',
  // Warm whites (for light mode backgrounds)
  cream: {
    50: '#FFFCFA',
    100: '#FFF8F3',
  },
  // Semantic
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
  },
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
  },
};

// ============================================
// THEME COLORS
// ============================================
export const ThemeColors = {
  light: {
    // Backgrounds - Warm, airy, slightly creamy
    background: Palette.cream[50],
    backgroundSecondary: Palette.neutral[50],
    backgroundTertiary: Palette.periwinkle[50],
    surface: Palette.white,
    surfaceHover: Palette.neutral[50],
    surfacePressed: Palette.neutral[100],

    // Text - Warm dark tones, not pure black
    text: Palette.neutral[900],
    textSecondary: Palette.neutral[500],
    textTertiary: Palette.neutral[400],
    textMuted: Palette.neutral[400],
    textInverse: Palette.white,

    // Brand - Soft periwinkle/lavender
    primary: Palette.periwinkle[500],
    primaryHover: Palette.periwinkle[600],
    primaryPressed: Palette.periwinkle[700],
    primaryLight: Palette.periwinkle[50],
    primaryMuted: Palette.periwinkle[100],
    tint: Palette.periwinkle[500],
    tintLight: Palette.periwinkle[100],

    // Accent - Warm coral/pink
    accent: Palette.coral[500],
    accentLight: Palette.coral[50],
    accentDark: Palette.coral[600],

    // Secondary - Teal
    teal: Palette.teal[500],
    tealLight: Palette.teal[50],

    // Card
    card: Palette.white,
    cardBorder: Palette.neutral[200],

    // Semantic
    success: Palette.emerald[500],
    successLight: Palette.emerald[50],
    successMuted: Palette.emerald[100],
    warning: Palette.amber[500],
    warningLight: Palette.amber[50],
    warningMuted: Palette.amber[100],
    error: Palette.coral[500],
    errorLight: Palette.coral[50],
    errorMuted: Palette.coral[100],
    info: Palette.sky[500],
    infoLight: Palette.sky[50],
    infoMuted: Palette.sky[100],

    // UI Elements
    border: Palette.neutral[200],
    borderLight: Palette.neutral[100],
    borderFocus: Palette.periwinkle[400],
    divider: Palette.neutral[100],

    // Interactive
    inputBg: Palette.white,
    inputBorder: Palette.neutral[300],
    inputFocus: Palette.periwinkle[500],
    placeholder: Palette.neutral[400],

    // Overlay
    overlay: 'rgba(28, 25, 23, 0.5)',
    overlayLight: 'rgba(28, 25, 23, 0.06)',

    // Shadows
    shadowColor: 'rgba(28, 25, 23, 0.08)',
    shadowColorStrong: 'rgba(28, 25, 23, 0.14)',

    // Recording states
    recording: Palette.coral[500],
    recordingLight: Palette.coral[50],
    paused: Palette.amber[500],
    pausedLight: Palette.amber[50],

    // Special - Icon colors
    icon: Palette.neutral[500],
    iconMuted: Palette.neutral[400],
  },
  dark: {
    // Backgrounds - Deep warm darks, cozy not cold
    background: Palette.neutral[950],
    backgroundSecondary: Palette.neutral[900],
    backgroundTertiary: Palette.neutral[800],
    surface: Palette.neutral[900],
    surfaceHover: Palette.neutral[800],
    surfacePressed: Palette.neutral[700],

    // Text - Warm off-whites
    text: '#F5F0EB',
    textSecondary: Palette.neutral[400],
    textTertiary: Palette.neutral[500],
    textMuted: Palette.neutral[500],
    textInverse: Palette.neutral[900],

    // Brand - Brighter periwinkle on dark
    primary: Palette.periwinkle[400],
    primaryHover: Palette.periwinkle[300],
    primaryPressed: Palette.periwinkle[500],
    primaryLight: 'rgba(139, 92, 246, 0.12)',
    primaryMuted: 'rgba(139, 92, 246, 0.20)',
    tint: Palette.periwinkle[400],
    tintLight: 'rgba(139, 92, 246, 0.12)',

    // Accent - Warm coral glow on dark
    accent: Palette.coral[400],
    accentLight: 'rgba(248, 127, 148, 0.12)',
    accentDark: Palette.coral[500],

    // Secondary - Teal
    teal: Palette.teal[400],
    tealLight: 'rgba(20, 184, 166, 0.12)',

    // Card
    card: Palette.neutral[900],
    cardBorder: Palette.neutral[800],

    // Semantic
    success: Palette.emerald[400],
    successLight: 'rgba(16, 185, 129, 0.12)',
    successMuted: 'rgba(16, 185, 129, 0.20)',
    warning: Palette.amber[400],
    warningLight: 'rgba(245, 158, 11, 0.12)',
    warningMuted: 'rgba(245, 158, 11, 0.20)',
    error: Palette.coral[400],
    errorLight: 'rgba(248, 127, 148, 0.12)',
    errorMuted: 'rgba(248, 127, 148, 0.20)',
    info: Palette.sky[400],
    infoLight: 'rgba(14, 165, 233, 0.12)',
    infoMuted: 'rgba(14, 165, 233, 0.20)',

    // UI Elements
    border: Palette.neutral[800],
    borderLight: 'rgba(255, 255, 255, 0.06)',
    borderFocus: Palette.periwinkle[400],
    divider: Palette.neutral[800],

    // Interactive
    inputBg: Palette.neutral[900],
    inputBorder: Palette.neutral[700],
    inputFocus: Palette.periwinkle[400],
    placeholder: Palette.neutral[500],

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.25)',

    // Shadows
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowColorStrong: 'rgba(0, 0, 0, 0.6)',

    // Recording states
    recording: Palette.coral[400],
    recordingLight: 'rgba(248, 127, 148, 0.12)',
    paused: Palette.amber[400],
    pausedLight: 'rgba(245, 158, 11, 0.12)',

    // Special - Icon colors
    icon: Palette.neutral[400],
    iconMuted: Palette.neutral[500],
  },
};

// ============================================
// TYPOGRAPHY
// ============================================
export const Typography = {
  fontFamily: {
    sans: 'System',
    mono: 'monospace',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tighter: -1,
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// ============================================
// SPACING
// ============================================
export const Spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// ============================================
// BORDER RADIUS
// ============================================
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// ============================================
// SHADOWS - Soft, diffused, warm
// ============================================
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  '2xl': {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 16,
  },
  // Periwinkle glow for primary elements
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  inner: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 0,
  },
};

// ============================================
// Z-INDEX
// ============================================
export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
};

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Convert hex color to rgba with specified opacity
 * @param hex - Hex color string (with or without #)
 * @param opacity - Opacity value from 0-1
 * @returns rgba color string
 */
export function withOpacity(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
