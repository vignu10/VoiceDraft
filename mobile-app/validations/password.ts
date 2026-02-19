import { z } from 'zod';

/**
 * Configurable password requirements
 */
export const passwordRequirements = {
  minLength: 6,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSpecialChars: false,
} as const;

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong';

export interface PasswordStrengthInfo {
  level: PasswordStrength;
  score: number; // 0-100
  feedback: string[];
}

/**
 * Calculate password strength based on configurable requirements
 */
export function calculatePasswordStrength(password: string): PasswordStrengthInfo {
  const feedback: string[] = [];
  let score = 0;

  // Length check (up to 40 points)
  if (password.length >= passwordRequirements.minLength) {
    score += 20;
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
  } else {
    feedback.push(`Use at least ${passwordRequirements.minLength} characters`);
  }

  // Character variety (up to 60 points)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  const varietyCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

  if (varietyCount >= 2) {
    score += 20;
    if (varietyCount >= 3) score += 20;
    if (varietyCount === 4) score += 20;
  } else {
    feedback.push('Mix letters, numbers, and symbols');
  }

  // Optional requirement checks
  if (passwordRequirements.requireUppercase && !hasUpperCase) {
    feedback.push('Add uppercase letters');
    score = Math.max(0, score - 10);
  }
  if (passwordRequirements.requireLowercase && !hasLowerCase) {
    feedback.push('Add lowercase letters');
    score = Math.max(0, score - 10);
  }
  if (passwordRequirements.requireNumbers && !hasNumbers) {
    feedback.push('Add numbers');
    score = Math.max(0, score - 10);
  }
  if (passwordRequirements.requireSpecialChars && !hasSpecialChars) {
    feedback.push('Add special characters');
    score = Math.max(0, score - 10);
  }

  // Determine strength level
  let level: PasswordStrength = 'weak';
  if (score >= 75) level = 'very-strong';
  else if (score >= 50) level = 'strong';
  else if (score >= 25) level = 'fair';

  return { level, score, feedback };
}

/**
 * Get strength meter color for level
 */
export function getStrengthColor(level: PasswordStrength): string {
  const colors = {
    weak: '#ef4444',
    fair: '#f59e0b',
    strong: '#84cc16',
    'very-strong': '#22c55e',
  };
  return colors[level];
}

/**
 * Get strength label for level
 */
export function getStrengthLabel(level: PasswordStrength): string {
  const labels = {
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
    'very-strong': 'Very Strong',
  };
  return labels[level];
}

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string({
    required_error: 'Please enter a password',
  })
  .min(passwordRequirements.minLength, {
    message: `Password must be at least ${passwordRequirements.minLength} characters`,
  });

/**
 * Zod refinement for password confirmation
 */
export const confirmPasswordSchema = (passwordField: string = 'password') =>
  z
    .string({
      required_error: 'Please confirm your password',
    })
    .min(1, { message: 'Please confirm your password' })
    .refine((val, ctx) => val === ctx.parent[passwordField as keyof typeof ctx.parent], {
      message: 'Passwords do not match',
    });
