# Auth Forms Refactoring Design

**Date:** 2025-02-19
**Status:** Approved
**Approach:** Minimal Refactor with react-hook-form + Zod

## Problem Statement

The authentication screens (`sign-up.tsx`, `sign-in.tsx`, `forgot-password.tsx`) currently have:
- Duplicate validation logic (email regex, validation functions in each file)
- Manual state management with `useState` for each field
- No proper form library, leading to verbose and error-prone code
- Inconsistent error handling

## Proposed Solution

Refactor auth forms to use:
- **react-hook-form** for form state management
- **Zod** for schema validation
- **Configurable password rules** for strength validation

## File Structure

```
mobile-app/
├── validations/
│   ├── auth.ts           # Auth-specific Zod schemas
│   ├── password.ts       # Password validation rules & utilities
│   └── common.ts         # Shared validators (email, etc.)
├── hooks/
│   └── use-auth-form.ts  # Shared form hook with react-hook-form setup
├── components/auth/
│   ├── password-strength-meter.tsx  # Visual password strength indicator
│   └── oauth-button.tsx             # Existing OAuth component (unchanged)
├── app/auth/
│   ├── sign-up.tsx       # Refactored to use react-hook-form
│   ├── sign-in.tsx       # Refactored to use react-hook-form
│   └── forgot-password.tsx # Refactored to use react-hook-form
```

## Component Details

### 1. Validation Files

#### `validations/common.ts`
- Email regex constant
- Common validator functions
- Reusable validation messages

#### `validations/password.ts`
- Configurable password requirements object
- Password strength calculation utility
- Zod refinement for password validation
- Strength meter labels and thresholds

#### `validations/auth.ts`
- `signUpSchema` - Email, password, confirm password, display name
- `signInSchema` - Email, password
- `forgotPasswordSchema` - Email

### 2. Shared Form Hook

#### `hooks/use-auth-form.ts`
- Generic hook accepting a Zod schema
- Configures react-hook-form with:
  - Proper default values
  - Validation mode (onBlur or onChange)
  - Error message formatting
- Returns:
  - `control` for react-hook-form Controller
  - `errors` object
  - `handleSubmit` wrapper
  - `isSubmitting` state
  - `reset` function

### 3. New Components

#### `components/auth/password-strength-meter.tsx`
- Visual indicator showing password strength
- Color-coded levels (weak/fair/strong/very strong)
- Animated transitions between states
- Optional text feedback

### 4. Refactored Auth Screens

Each screen will:
- Import its schema from `validations/auth.ts`
- Use `useAuthForm` hook for form state
- Replace `useState` form fields with react-hook-form `Controller`
- Remove manual validation functions
- Keep existing UI/UX (animations, styling)

## Password Strength Metering

Password strength will be calculated based on:
- Length requirements
- Character variety (uppercase, lowercase, numbers, symbols)
- Optional entropy calculation

The meter will show 4 levels:
- **Weak** (0-25%)
- **Fair** (26-50%)
- **Strong** (51-75%)
- **Very Strong** (76-100%)

## Implementation Steps

1. Install dependencies: `react-hook-form`, `zod`, `@hookform/resolvers`
2. Create `validations/` folder with schemas
3. Create `use-auth-form` hook
4. Create `PasswordStrengthMeter` component
5. Refactor `sign-up.tsx`
6. Refactor `sign-in.tsx`
7. Refactor `forgot-password.tsx`
8. Test all auth flows

## Success Criteria

- [ ] All duplicate validation logic removed
- [ ] Forms use react-hook-form + Zod
- [ ] Password rules are configurable
- [ ] Password strength meter functional
- [ ] All existing UI/UX preserved
- [ ] TypeScript types properly inferred
- [ ] No runtime errors
- [ ] Forms validate correctly on submit and blur
