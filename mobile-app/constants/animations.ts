/**
 * VoiceScribe Animation System
 * Consistent, smooth animations throughout the app
 */

import { Easing } from "react-native-reanimated";

// ============================================
// DURATION TOKENS
// ============================================
export const Duration = {
  instant: 0,
  fastest: 100,
  fast: 150,
  normal: 200,
  moderate: 300,
  slow: 400,
  slower: 500,
  slowest: 700,

  // Specific use cases
  buttonPress: 100,
  modalEnter: 300,
  modalExit: 200,
  pageTransition: 350,
  toast: 250,
  skeleton: 1500,
  pulse: 2000,
  stagger: 50, // Delay between staggered items
};

// ============================================
// EASING CURVES
// ============================================
export const Easings = {
  // Standard easings
  linear: Easing.linear,

  // Ease out - start fast, end slow (most common for entrances)
  easeOut: Easing.out(Easing.cubic),
  easeOutQuad: Easing.out(Easing.quad),
  easeOutCubic: Easing.out(Easing.cubic),
  easeOutQuart: Easing.out(Easing.exp),
  easeOutBack: Easing.out(Easing.back(1.7)),
  easeOutElastic: Easing.out(Easing.elastic(1)),

  // Ease in - start slow, end fast (for exits)
  easeIn: Easing.in(Easing.cubic),
  easeInQuad: Easing.in(Easing.quad),
  easeInCubic: Easing.in(Easing.cubic),

  // Ease in-out - smooth both ends
  easeInOut: Easing.inOut(Easing.cubic),
  easeInOutQuad: Easing.inOut(Easing.quad),
  easeInOutCubic: Easing.inOut(Easing.cubic),

  // Bounce and spring effects
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),

  // Custom bezier curves
  snappy: Easing.bezier(0.4, 0, 0.2, 1),
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
};

// ============================================
// SPRING CONFIGURATIONS
// ============================================
export const Springs = {
  // Gentle spring - subtle, professional
  gentle: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },

  // Default spring - balanced
  default: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  },

  // Snappy spring - quick and responsive
  snappy: {
    damping: 20,
    stiffness: 400,
    mass: 0.8,
  },

  // Bouncy spring - playful feel
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },

  // Stiff spring - minimal overshoot
  stiff: {
    damping: 30,
    stiffness: 500,
    mass: 1,
  },

  // Soft spring - floaty feel
  soft: {
    damping: 25,
    stiffness: 120,
    mass: 1.2,
  },

  // Button press - snappy and responsive
  press: {
    damping: 25,
    stiffness: 600,
    mass: 0.3,
  },

  // Modal/sheet
  modal: {
    damping: 25,
    stiffness: 300,
    mass: 0.9,
  },

  // List items
  list: {
    damping: 18,
    stiffness: 250,
    mass: 0.8,
  },
};

// ============================================
// ANIMATION PRESETS
// ============================================
export const AnimationPresets = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: Duration.normal,
    easing: Easings.easeOut,
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: Duration.fast,
    easing: Easings.easeIn,
  },

  // Scale animations
  scaleIn: {
    from: { scale: 0.9, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    duration: Duration.moderate,
    easing: Easings.easeOutBack,
  },
  scaleOut: {
    from: { scale: 1, opacity: 1 },
    to: { scale: 0.9, opacity: 0 },
    duration: Duration.fast,
    easing: Easings.easeIn,
  },

  // Slide animations
  slideInUp: {
    from: { translateY: 20, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
    duration: Duration.moderate,
    easing: Easings.easeOut,
  },
  slideInDown: {
    from: { translateY: -20, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
    duration: Duration.moderate,
    easing: Easings.easeOut,
  },
  slideInLeft: {
    from: { translateX: -20, opacity: 0 },
    to: { translateX: 0, opacity: 1 },
    duration: Duration.moderate,
    easing: Easings.easeOut,
  },
  slideInRight: {
    from: { translateX: 20, opacity: 0 },
    to: { translateX: 0, opacity: 1 },
    duration: Duration.moderate,
    easing: Easings.easeOut,
  },

  // Sheet/Modal animations
  sheetEnter: {
    from: { translateY: 300, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
    duration: Duration.modalEnter,
    spring: Springs.modal,
  },
  sheetExit: {
    from: { translateY: 0, opacity: 1 },
    to: { translateY: 300, opacity: 0 },
    duration: Duration.modalExit,
    easing: Easings.easeIn,
  },

  // Button press
  buttonPress: {
    scale: 0.97,
    duration: Duration.buttonPress,
    spring: Springs.press,
  },

  // Pulse/Glow
  pulse: {
    from: { scale: 1, opacity: 1 },
    to: { scale: 1.05, opacity: 0.8 },
    duration: Duration.pulse,
    repeat: true,
  },
};

// ============================================
// TRANSITION CONFIGS
// ============================================
export const Transitions = {
  // For timing-based animations
  timing: (duration: number, easing = Easings.easeOut) => ({
    duration,
    easing,
  }),

  // For spring-based animations
  spring: (config = Springs.default) => ({
    damping: config.damping,
    stiffness: config.stiffness,
    mass: config.mass,
  }),
};

// ============================================
// STAGGER UTILITIES
// ============================================
export const Stagger = {
  // Calculate delay for staggered animations
  delay: (index: number, baseDelay = Duration.stagger) => index * baseDelay,

  // Configurations
  fast: 30,
  normal: 50,
  slow: 80,
};
