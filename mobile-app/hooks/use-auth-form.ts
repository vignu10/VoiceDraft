import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

/**
 * Generic hook for auth forms using react-hook-form + Zod
 *
 * @param schema - Zod schema for validation
 * @param defaultValues - Default form values
 * @returns Form control, handlers, and state
 */
export function useAuthForm<T extends z.ZodType<any, any, any>>(
  schema: T,
  defaultValues: z.infer<T>
) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema as any), // Type assertion for compatibility
    defaultValues,
    mode: 'onBlur', // Validate on field blur
    reValidateMode: 'onBlur',
  });

  return {
    control: form.control,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    handleSubmit: form.handleSubmit,
    reset: form.reset,
    setError: form.setError,
    clearErrors: form.clearErrors,
    getValues: form.getValues,
    watch: form.watch,
  };
}
