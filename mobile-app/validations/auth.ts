import { z } from 'zod';
import { emailSchema, nonEmptyString, minLength } from './common';
import { passwordSchema, confirmPasswordSchema } from './password';

/**
 * Sign Up Form Schema
 */
export const signUpSchema = z
  .object({
    displayName: nonEmptyString('name').pipe(minLength(2, 'name')),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema('password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

/**
 * Sign In Form Schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, {
    message: 'Please enter your password',
  }),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

/**
 * Forgot Password Form Schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
