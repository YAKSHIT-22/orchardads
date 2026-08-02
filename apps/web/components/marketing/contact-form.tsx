'use client';

import { Button } from '@adsos/ui';
import { useState } from 'react';

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        message: form.get('message'),
      }),
    });
    if (res.ok) {
      setState('sent');
      setMessage('Thanks - we will reply within one business day.');
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setState('error');
      setMessage(j.error ?? 'Something failed. Email us directly instead.');
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-md border border-applied/40 bg-applied-wash px-4 py-6 text-center">
        <p className="font-ui text-sm text-applied">{message}</p>
      </div>
    );
  }

  const field = 'h-[38px] rounded-md border border-rule bg-paper px-3 font-ui text-sm text-ink outline-none focus:border-iris';

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-label text-ink-muted">Name</span>
          <input name="name" required className={field} autoComplete="name" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label text-ink-muted">Work email</span>
          <input name="email" type="email" required className={field} autoComplete="email" />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-label text-ink-muted">How can we help?</span>
        <textarea
          name="message"
          required
          rows={5}
          className="rounded-md border border-rule bg-paper p-3 font-ui text-sm text-ink outline-none focus:border-iris"
        />
      </label>
      {state === 'error' && <span className="font-ui text-[12px] text-risk">{message}</span>}
      <Button type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  );
}
