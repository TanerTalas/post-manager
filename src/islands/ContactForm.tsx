import { useEffect, useRef, useState } from 'preact/hooks';
import {
  CONTACT_LIMITS,
  HONEYPOT_FIELD,
  validateContact,
  type ContactField,
  type ValidationError,
} from '~/lib/contact';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface Props {
  /** Public Turnstile key. Empty until the deployment is configured. */
  siteKey: string;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

const MUTED = 'color-mix(in srgb, var(--color-text) 55%, transparent)';
const DANGER = '#b3261e';

export default function ContactForm({ siteKey }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState('');

  const honeypot = useRef<HTMLInputElement | null>(null);
  const widget = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef('');
  const openedAt = useRef(Date.now());

  // Turnstile is rendered explicitly rather than by class name, so it does not
  // race the island's own hydration.
  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !widget.current || widgetId.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(widget.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (value) => {
          token.current = value;
          setErrors((current) => current.filter((entry) => entry.field !== 'token'));
        },
        'expired-callback': () => {
          token.current = '';
        },
        'error-callback': () => {
          token.current = '';
        },
      });
    };

    if (window.turnstile) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', render);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', render);
    };
  }, [siteKey]);

  const errorFor = (field: ContactField) =>
    errors.find((entry) => entry.field === field)?.message ?? '';

  const submit = async () => {
    if (status === 'sending') return;

    const payload = { name, email, message };
    const found = validateContact(payload);

    if (siteKey && !token.current) {
      found.push({ field: 'token', message: 'Finish the spam check first.' });
    }

    setErrors(found);
    if (found.length) return;

    setStatus('sending');
    setFailure('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          token: token.current,
          elapsed: Date.now() - openedAt.current,
          [HONEYPOT_FIELD]: honeypot.current?.value ?? '',
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        errors?: ValidationError[];
      };

      if (response.ok && result.ok) {
        setStatus('sent');
        setName('');
        setEmail('');
        setMessage('');
        return;
      }

      if (result.errors?.length) {
        setErrors(result.errors);
        setStatus('idle');
      } else {
        setFailure(result.error ?? 'Something went wrong on the way. Try again in a moment.');
        setStatus('error');
      }
    } catch {
      setFailure('The message could not leave your browser. Check your connection and try again.');
      setStatus('error');
    } finally {
      // A token is good for one submission, so the widget starts over either way.
      token.current = '';
      if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
    }
  };

  if (status === 'sent') {
    return (
      <div
        role="status"
        style="border:1px solid var(--color-accent);border-radius:var(--radius-md);background:color-mix(in srgb, var(--color-accent) 7%, transparent);padding:22px 24px"
      >
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:20px;margin:0 0 8px">
          It is on its way
        </h2>
        <p style="font-size:15px;line-height:1.8;margin:0;text-wrap:pretty">
          Thank you for writing. I read everything, and I reply to most of it within a few days.
        </p>
        <button
          class="btn btn-secondary"
          onClick={() => {
            openedAt.current = Date.now();
            setStatus('idle');
          }}
          style="margin-top:18px;font-size:13px"
        >
          Write another
        </button>
      </div>
    );
  }

  const sending = status === 'sending';

  return (
    <form
      novalidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
        <Field label="Your name" error={errorFor('name')}>
          <input
            class="input"
            name="name"
            autocomplete="name"
            maxLength={CONTACT_LIMITS.name}
            value={name}
            disabled={sending}
            aria-invalid={errorFor('name') ? 'true' : undefined}
            onInput={(event) => setName((event.target as HTMLInputElement).value)}
            placeholder="Elif Yılmaz"
          />
        </Field>

        <Field label="Where I can reach you" error={errorFor('email')}>
          <input
            class="input"
            name="email"
            type="email"
            autocomplete="email"
            maxLength={CONTACT_LIMITS.email}
            value={email}
            disabled={sending}
            aria-invalid={errorFor('email') ? 'true' : undefined}
            onInput={(event) => setEmail((event.target as HTMLInputElement).value)}
            placeholder="elif@example.com"
          />
        </Field>
      </div>

      <div style="margin-top:16px">
        <Field label="What's on your mind" error={errorFor('message')}>
          <textarea
            class="input"
            name="message"
            maxLength={CONTACT_LIMITS.message}
            value={message}
            disabled={sending}
            aria-invalid={errorFor('message') ? 'true' : undefined}
            onInput={(event) => setMessage((event.target as HTMLTextAreaElement).value)}
            placeholder="Say as much or as little as you like."
            style="min-height:150px;line-height:1.75"
          />
        </Field>
      </div>

      {/* Not for people. Hidden from view, from tab order and from screen readers. */}
      <div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden">
        <label>
          Company
          <input ref={honeypot} name={HONEYPOT_FIELD} tabIndex={-1} autocomplete="off" />
        </label>
      </div>

      {siteKey ? <div ref={widget} style="margin-top:18px" /> : null}

      {errorFor('token') ? (
        <p style={`font-size:13px;line-height:1.6;margin:10px 0 0;color:${DANGER}`}>
          {errorFor('token')}
        </p>
      ) : null}

      <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:18px">
        <button class="btn btn-primary" type="submit" disabled={sending} style="padding:10px 20px;font-size:14px">
          {sending ? 'Sending' : 'Send it'}
        </button>
        <span
          role={status === 'error' ? 'alert' : undefined}
          style={`font-size:12px;line-height:1.6;color:${status === 'error' ? DANGER : MUTED}`}
        >
          {status === 'error'
            ? failure
            : siteKey
              ? 'Checked for spam by Cloudflare. Your address is used to reply, nothing else.'
              : 'The contact endpoint is not configured for this deployment yet.'}
        </span>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  error: string;
  children: preact.ComponentChildren;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label class="field">
      <span style="font-size:14px">{label}</span>
      {children}
      {error ? <span style={`font-size:12px;line-height:1.5;color:${DANGER}`}>{error}</span> : null}
    </label>
  );
}
