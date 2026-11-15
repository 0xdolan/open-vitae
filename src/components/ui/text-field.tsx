import { useId, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { controlClass } from './field';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Validation message; shown under the field and announced. */
  readonly error?: string | null;
  readonly hint?: string;
  readonly className?: string;
}

/**
 * Labelled text input. Text direction follows what is typed (dir="auto"),
 * so Persian, Arabic and English all display correctly in either UI direction.
 */
export function TextField({ label, value, onChange, error, hint, className, id, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-xs font-semibold text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        dir="auto"
        className={cn(controlClass, error && 'border-red-500 focus-visible:border-red-600')}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {message ? (
        <p id={messageId} className={cn('text-xs', error ? 'font-medium text-red-700' : 'text-stone-500')}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
