import { useState, useCallback } from 'react';
import type { ValidationState } from '@/components/ui/types';

export type Validator<T> = (value: T) => string | undefined;
export type AsyncValidator<T> = (value: T) => Promise<string | undefined>;
export type FieldValidator<T> = (value: T, options: ValidationOptions<T>) => string | undefined;

export interface ValidationOptions<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: Validator<T>;
  asyncValidation?: AsyncValidator<T>;
}

export interface ValidationRules {
  [key: string]: ValidationOptions<any>;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Common validators
export const validators = {
  required: (value: any): string | undefined =>
    !value ? 'This field is required' : undefined,

  email: (value: string): string | undefined =>
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
      ? 'Invalid email address'
      : undefined,

  minLength: (length: number) => (value: string): string | undefined =>
    value.length < length
      ? `Must be at least ${length} characters`
      : undefined,

  maxLength: (length: number) => (value: string): string | undefined =>
    value.length > length
      ? `Must be no more than ${length} characters`
      : undefined,

  pattern: (pattern: RegExp, message: string) => (value: string): string | undefined =>
    !pattern.test(value) ? message : undefined,

  matches: (matchValue: any, message: string) => (value: any): string | undefined =>
    value !== matchValue ? message : undefined,

  number: (value: any): string | undefined =>
    isNaN(Number(value)) ? 'Must be a number' : undefined,

  url: (value: string): string | undefined =>
    !/^https?:\/\/.*/.test(value) ? 'Must be a valid URL' : undefined,
};

export const validateField: FieldValidator<any> = (value, options) => {
  if (options.required && validators.required(value)) {
    return validators.required(value);
  }

  if (typeof value === 'string') {
    if (options.minLength && validators.minLength(options.minLength)(value)) {
      return validators.minLength(options.minLength)(value);
    }

    if (options.maxLength && validators.maxLength(options.maxLength)(value)) {
      return validators.maxLength(options.maxLength)(value);
    }

    if (options.pattern && validators.pattern(options.pattern, 'Invalid format')(value)) {
      return validators.pattern(options.pattern, 'Invalid format')(value);
    }
  }

  if (options.custom) {
    return options.custom(value);
  }

  return undefined;
};

export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: ValidationRules
): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.entries(rules).forEach(([field, options]) => {
    const error = validateField(values[field], options);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validateFieldAsync = useCallback(async (
    name: keyof T,
    value: T[keyof T]
  ): Promise<boolean> => {
    if (!validationRules?.[name as string]) return true;

    const rules = validationRules[name as string];
    const syncError = validateField(value, rules);

    if (syncError) {
      setErrors(prev => ({ ...prev, [name]: syncError }));
      return false;
    }

    if (rules.asyncValidation) {
      try {
        const asyncError = await rules.asyncValidation(value);
        if (asyncError) {
          setErrors(prev => ({ ...prev, [name]: asyncError }));
          return false;
        }
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Validation failed. Please try again.',
        }));
        return false;
      }
    }

    setErrors(prev => ({ ...prev, [name]: undefined }));
    return true;
  }, [validationRules]);

  const handleChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback(async (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    await validateFieldAsync(name as keyof T, value as T[keyof T]);
  }, [validateFieldAsync]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!validationRules) return true;

    const validations = Object.entries(values).map(([field, value]) =>
      validateFieldAsync(field as keyof T, value)
    );

    const results = await Promise.all(validations);
    return results.every(Boolean);
  }, [values, validateFieldAsync]);

  const handleSubmit = useCallback((
    onSubmit: (values: T) => Promise<void> | void
  ) => async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const isValid = await validateForm();
      if (isValid) {
        await Promise.resolve(onSubmit(values));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm]);

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField: validateFieldAsync,
    validateForm,
    setValues,
    setErrors,
    reset: useCallback(() => {
      setValues(initialValues);
      setErrors({});
      setIsDirty(false);
    }, [initialValues]),
  };
}
