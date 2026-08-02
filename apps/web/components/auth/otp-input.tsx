'use client';

import { cn } from '@adsos/ui';
import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef } from 'react';

const LENGTH = 6;
// Stable per-slot ids (not derived from a map index) - the grid is a fixed
// length and slots never reorder, but biome's index-key rule can't tell that
// from a plain `.map((_, i) => ...)`, so we give each slot a real identity.
const SLOTS = Array.from({ length: LENGTH }, (_, i) => `otp-slot-${i}`);

/** Six-digit code entry: one box per digit, auto-advance, backspace-to-prior,
 *  and paste-the-whole-code support. `value` and `onChange` carry the full
 *  string so the parent can drive it with a single piece of state. */
export function OtpInput({
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(''));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, digit);
    if (digit && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    const next = digits.slice();
    for (let i = 0; i < pasted.length && index + i < LENGTH; i++) {
      next[index + i] = pasted[i] ?? '';
    }
    onChange(next.join(''));
    const lastFilled = Math.min(index + pasted.length, LENGTH) - 1;
    refs.current[lastFilled]?.focus();
  }

  return (
    <div className="flex gap-2">
      {SLOTS.map((slotId, index) => (
        <input
          key={slotId}
          value={digits[index]}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          className={cn(
            'h-12 w-10 rounded-md border border-rule bg-paper text-center font-data text-lg text-ink shadow-xs outline-none',
            'transition-colors focus:border-iris',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-paper-sunk',
          )}
        />
      ))}
    </div>
  );
}
