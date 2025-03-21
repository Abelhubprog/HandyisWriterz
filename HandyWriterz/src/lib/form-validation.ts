import { ValidationOptions } from './validation';

type FormField = {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
};

export type ValidationSchema = {
  [key: string]: FormField;
};

// Common validation patterns
export const patterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  name: /^[a-zA-Z\s]*$/,
  phone: /^\+?[\d\s-()]*$/,
  url: /^https?:\/\/.+/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
};

// Common form validation rules
export const commonRules = {
  required: { required: true, message: 'This field is required' },
  email: { pattern: patterns.email, message: 'Invalid email address' },
  name: { pattern: patterns.name, message: 'Name can only contain letters and spaces' },
  phone: { pattern: patterns.phone, message: 'Invalid phone number' },
  url: { pattern: patterns.url, message: 'Must be a valid URL' },
  password: { pattern: patterns.password, message: 'Password must be at least 8 characters with one letter and one number' },
};

// Convert schema to validation rules
export function createValidationRules(schema: ValidationSchema): Record<string, ValidationOptions<any>> {
  return Object.entries(schema).reduce((rules, [field, config]) => {
    const validations: ValidationOptions<any> = {};

    if (config.required) {
      validations.required = true;
    }

    if (config.minLength || config.maxLength) {
      validations.custom = (value: string) => {
        if (config.minLength && value.length < config.minLength) {
          return `Must be at least ${config.minLength} characters`;
        }
        if (config.maxLength && value.length > config.maxLength) {
          return `Must be no more than ${config.maxLength} characters`;
        }
        return undefined;
      };
    }

    if (config.min || config.max) {
      validations.custom = (value: number) => {
        if (config.min && value < config.min) {
          return `Must be at least ${config.min}`;
        }
        if (config.max && value > config.max) {
          return `Must be no more than ${config.max}`;
        }
        return undefined;
      };
    }

    if (config.pattern) {
      validations.custom = (value: string) => {
        if (!config.pattern?.test(value)) {
          return config.message || 'Invalid format';
        }
        return undefined;
      };
    }

    rules[field] = validations;
    return rules;
  }, {} as Record<string, ValidationOptions<any>>);
}

// Example usage:
export const exampleSchema = {
  name: {
    required: true,
    minLength: 2,
    pattern: patterns.name,
    message: 'Name must contain only letters and spaces',
  },
  email: {
    required: true,
    pattern: patterns.email,
    message: 'Please enter a valid email address',
  },
  age: {
    required: true,
    min: 18,
    max: 100,
    message: 'Age must be between 18 and 100',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: patterns.password,
    message: 'Password must be at least 8 characters with one letter and one number',
  },
};
