import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase';
import { checkRateLimit, RateLimitConfig } from '@/lib/rate-limit';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Authentication middleware factory
 * Returns user object or throws error
 */
export async function requireAuth(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Optional authentication - returns user or null
 */
export async function optionalAuth(req: NextRequest) {
  return await getUserFromRequest(req);
}

/**
 * Rate limiting middleware factory
 */
export function requireRateLimit(identifier: string, config: RateLimitConfig) {
  const result = checkRateLimit(identifier, config);

  if (!result.allowed) {
    const resetDate = new Date(result.resetTime);
    const minutesUntilReset = Math.ceil((result.resetTime - Date.now()) / 60000);

    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${minutesUntilReset} minutes.`,
      result.resetTime
    );
  }

  return result;
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Input validation helpers
 */
export const validators = {
  required: (value: any, fieldName: string) => {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError({ [fieldName]: `${fieldName} is required` });
    }
  },

  string: (value: any, fieldName: string) => {
    if (value !== undefined && value !== null && typeof value !== 'string') {
      throw new ValidationError({ [fieldName]: `${fieldName} must be a string` });
    }
  },

  number: (value: any, fieldName: string) => {
    if (value !== undefined && value !== null && typeof value !== 'number') {
      throw new ValidationError({ [fieldName]: `${fieldName} must be a number` });
    }
  },

  email: (value: string, fieldName: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new ValidationError({ [fieldName]: `${fieldName} must be a valid email` });
    }
  },

  minLength: (value: string, min: number, fieldName: string) => {
    if (value && value.length < min) {
      throw new ValidationError({ [fieldName]: `${fieldName} must be at least ${min} characters` });
    }
  },

  maxLength: (value: string, max: number, fieldName: string) => {
    if (value && value.length > max) {
      throw new ValidationError({ [fieldName]: `${fieldName} must be at most ${max} characters` });
    }
  },

  enum: (value: any, allowedValues: any[], fieldName: string) => {
    if (value !== undefined && !allowedValues.includes(value)) {
      throw new ValidationError({ [fieldName]: `${fieldName} must be one of: ${allowedValues.join(', ')}` });
    }
  },

  url: (value: string, fieldName: string) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      throw new ValidationError({ [fieldName]: `${fieldName} must be a valid URL` });
    }
  },
};

/**
 * Schema validator helper
 */
export function validateSchema<T>(
  data: any,
  schema: {
    required?: string[];
    validations?: Array<(data: any) => void>;
  }
): T {
  const errors: Record<string, string> = {};

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors[field] = `${field} is required`;
      }
    }
  }

  // Run custom validations
  if (schema.validations) {
    for (const validation of schema.validations) {
      try {
        validation(data);
      } catch (error) {
        if (error instanceof ValidationError) {
          Object.assign(errors, error.fields);
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return data as T;
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown) {
  console.error('[API Error]', error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: 'Validation failed', fields: error.fields },
      { status: 400 }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message, resetTime: new Date(error.resetTime).toISOString() },
      {
        status: 429,
        headers: {
          'X-RateLimit-Reset': String(error.resetTime),
          'Retry-After': String(Math.ceil((error.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  const message = error instanceof Error ? error.message : 'An error occurred';
  const status = (error as any)?.status || 500;

  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.stack : undefined,
      }),
    },
    { status }
  );
}

/**
 * Standard success response helper
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}
