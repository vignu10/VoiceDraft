import { z } from 'zod';

/**
 * Common validation constants and utilities
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Zod schema for email validation
 */
export const emailSchema = z
  .string({
    required_error: 'Please enter your email',
  })
  .min(1, { message: 'Please enter your email' })
  .regex(EMAIL_REGEX, { message: 'Please enter a valid email address' })
  .trim();

/**
 * Generic non-empty string validator
 */
export const nonEmptyString = (fieldName: string) =>
  z
    .string({
      required_error: `Please enter ${fieldName}`,
    })
    .min(1, { message: `Please enter ${fieldName}` })
    .trim();

/**
 * Generic minimum length validator
 */
export const minLength = (length: number, fieldName: string) =>
  z
    .string()
    .min(length, { message: `${fieldName} must be at least ${length} characters` });
