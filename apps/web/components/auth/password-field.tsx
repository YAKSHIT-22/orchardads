'use client';

import { Field, Input } from '@adsos/ui';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

/** Password input with a show/hide toggle, wired for react-hook-form via
 *  `register`. Wraps @adsos/ui's Field so it matches the label/hint/error
 *  layout every other form in the app uses. */
export function PasswordField({
  id,
  label,
  placeholder,
  register,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          invalid={!!error}
          autoComplete={autoComplete}
          className="pr-10"
          {...register}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}
