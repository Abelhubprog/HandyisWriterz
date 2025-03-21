import { useState, useCallback, useEffect } from 'react';
import type { ValidationOptions } from '@/lib/validation';
import { validateField } from '@/lib/validation';

interface FieldState<T> {
  value: T;
  error?: string;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
}

interface UseFieldOptions<T> extends ValidationOptions<T> {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  transform?: (value: any) => T;
}

export function useField<T = string>(
  initialValue: T,
  options: UseFieldOptions<T> = {}
) {
  const [state, setState] = useState<FieldState<T>>({
    value: initialValue,
    isDirty: false,
    isTouched: false,
    isValidating: false,
  });

  const validate = useCallback(async (valueToValidate: T = state.value): Promise<boolean> => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      // Run synchronous validation
      const syncError = validateField(valueToValidate, options);
      if (syncError) {
        setState(prev => ({
          ...prev,
          error: syncError,
          isValidating: false,
        }));
        return false;
      }

      // Run async validation if provided
      if (options.asyncValidation) {
        try {
          const asyncError = await options.asyncValidation(valueToValidate);
          if (asyncError) {
            setState(prev => ({
              ...prev,
              error: asyncError,
              isValidating: false,
            }));
            return false;
          }
        } catch (error) {
          setState(prev => ({
            ...prev,
            error: 'Validation failed. Please try again.',
            isValidating: false,
          }));
          return false;
        }
      }

      // Clear error if validation passes
      setState(prev => ({
        ...prev,
        error: undefined,
        isValidating: false,
      }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isValidating: false,
      }));
      return false;
    }
  }, [state.value, options]);

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prev => {
      const value = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev.value)
        : newValue;

      const nextState = {
        ...prev,
        value,
        isDirty: value !== initialValue,
      };

      if (options.validateOnChange) {
        validate(value);
      }

      return nextState;
    });
  }, [initialValue, options.validateOnChange, validate]);

  const setTouched = useCallback((isTouched: boolean = true) => {
    setState(prev => ({
      ...prev,
      isTouched,
    }));

    if (isTouched && options.validateOnBlur) {
      validate();
    }
  }, [options.validateOnBlur, validate]);

  const reset = useCallback(() => {
    setState({
      value: initialValue,
      isDirty: false,
      isTouched: false,
      isValidating: false,
      error: undefined,
    });
  }, [initialValue]);

  const handleChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setValue(options.transform ? options.transform(value) : value as unknown as T);
  }, [options.transform, setValue]);

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, [setTouched]);

  return {
    value: state.value,
    error: state.error,
    isDirty: state.isDirty,
    isTouched: state.isTouched,
    isValidating: state.isValidating,
    setValue,
    setTouched,
    validate,
    reset,
    handleChange,
    handleBlur,
    // For use with form elements
    inputProps: {
      value: state.value,
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': !!state.error,
      'aria-describedby': state.error ? `${state.value}-error` : undefined,
    },
  };
};
