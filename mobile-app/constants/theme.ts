/**
 * VoiceScribe Theme Configuration
 * Comprehensive color system for light and dark modes
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Base colors
    text: '#1a1a2e',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',

    // Interactive elements
    tint: '#6366f1', // Indigo - primary brand color
    tintLight: '#818cf8',
    tintDark: '#4f46e5',

    // UI elements
    card: '#ffffff',
    cardBorder: '#e2e8f0',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    // Icons
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#6366f1',

    // Status colors
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe',

    // Recording states
    recording: '#ef4444',
    recordingBg: '#fef2f2',
    paused: '#f59e0b',
    pausedBg: '#fffbeb',

    // Input fields
    inputBg: '#f8fafc',
    inputBorder: '#e2e8f0',
    inputFocus: '#6366f1',
    placeholder: '#94a3b8',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    // Base colors
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    background: '#0f172a',
    backgroundSecondary: '#1e293b',

    // Interactive elements
    tint: '#818cf8', // Lighter indigo for dark mode
    tintLight: '#a5b4fc',
    tintDark: '#6366f1',

    // UI elements
    card: '#1e293b',
    cardBorder: '#334155',
    border: '#334155',
    borderLight: '#1e293b',

    // Icons
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#818cf8',

    // Status colors
    success: '#34d399',
    successLight: '#064e3b',
    warning: '#fbbf24',
    warningLight: '#451a03',
    error: '#f87171',
    errorLight: '#450a0a',
    info: '#60a5fa',
    infoLight: '#1e3a5f',

    // Recording states
    recording: '#f87171',
    recordingBg: '#450a0a',
    paused: '#fbbf24',
    pausedBg: '#451a03',

    // Input fields
    inputBg: '#1e293b',
    inputBorder: '#334155',
    inputFocus: '#818cf8',
    placeholder: '#64748b',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Font sizes
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
