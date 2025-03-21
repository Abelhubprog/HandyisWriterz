import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { FormControl, FormLabel, FormMessage, FormDescription } from './form';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || props.name;
    const descriptionId = description ? `${checkboxId}-description` : undefined;
    const errorId = error ? `${checkboxId}-error` : undefined;

    return (
      <FormControl className="flex items-start gap-3">
        <div className="relative flex h-5 items-center">
          <input
            type="checkbox"
            ref={ref}
            id={checkboxId}
            className={cn(
              'h-4 w-4 rounded border border-gray-300',
              'text-blue-600 focus:ring-blue-500',
              'transition duration-150 ease-in-out',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : 
              description ? descriptionId : 
              undefined
            }
            {...props}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          {label && (
            <FormLabel
              htmlFor={checkboxId}
              className={cn(
                'text-sm cursor-pointer select-none',
                props.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </FormLabel>
          )}
          {description && (
            <FormDescription id={descriptionId}>
              {description}
            </FormDescription>
          )}
          {error && (
            <FormMessage id={errorId} role="alert">
              {error}
            </FormMessage>
          )}
        </div>
      </FormControl>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface CheckboxGroupProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  className?: string;
}

export function CheckboxGroup({ 
  children, 
  label, 
  description,
  error,
  className 
}: CheckboxGroupProps) {
  const groupId = label?.toLowerCase().replace(/\s+/g, '-');
  const descriptionId = description ? `${groupId}-description` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <FormControl className={cn('space-y-4', className)}>
      {label && (
        <FormLabel>
          {label}
        </FormLabel>
      )}
      {description && (
        <FormDescription id={descriptionId}>
          {description}
        </FormDescription>
      )}
      <div 
        className="space-y-3"
        role="group"
        aria-labelledby={groupId}
        aria-describedby={
          error ? errorId : 
          description ? descriptionId : 
          undefined
        }
      >
        {children}
      </div>
      {error && (
        <FormMessage id={errorId} role="alert">
          {error}
        </FormMessage>
      )}
    </FormControl>
  );
}
