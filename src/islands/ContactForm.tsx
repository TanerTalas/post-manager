import { useEffect, useRef, useState } from 'preact/hooks';
import {
  CONTACT_LIMITS,
  HONEYPOT_FIELD,
  validateContact,
  type ContactField,
  type ValidationError,
} from '~/lib/contact';
import { translator, type Lang } from '~/i18n';
import type { StringKey } from '~/i18n/en';

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
  lang: Lang;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

const MUTED = 'color-mix(in srgb, var(--color-text) 55%, transparent)';
const DANGER = '#b3261e';

export default function ContactForm({ siteKey, lang }: Props) {
  const t = translator(lang);

  // The endpoint answers with keys, never prose: it has no idea which language
  // the page was in. Naming them is this side's job.
  const say = (error: ValidationError | undefined) =>
    error ? t(error.key as StringKey, error.values) : '';
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

  const errorFor = (field: ContactField) => say(errors.find((entry) => entry.field === field));

  const submit = async () => {
    if (status === 'sending') return;

    const payload = { name, email, message };
    const found = validateContact(payload);

    if (siteKey && !token.current) {
      found.push({ field: 'token', key: 'error.tokenRequired' });
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
        setFailure(t((result.error as StringKey) ?? 'error.generic'));
        setStatus('error');
      }
    } catch {
      setFailure(t('error.network'));
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
          {t('contact.sentTitle')}
        </h2>
        <p style="font-size:15px;line-height:1.8;margin:0;text-wrap:pretty">
          {t('contact.sentBody')}
        </p>
        <button
          class="btn btn-secondary"
          onClick={() => {
            openedAt.current = Date.now();
            setStatus('idle');
          }}
          style="margin-top:18px;font-size:13px"
        >
          {t('contact.writeAnother')}
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
        <Field label={t('contact.name')} error={errorFor('name')}>
          <input
            class="input"
            name="name"
            autocomplete="name"
            maxLength={CONTACT_LIMITS.name}
            value={name}
            disabled={sending}
            aria-invalid={errorFor('name') ? 'true' : undefined}
            onInput={(event) => setName((event.target as HTMLInputElement).value)}
            placeholder={t('contact.namePlaceholder')}
          />
        </Field>

        <Field label={t('contact.email')} error={errorFor('email')}>
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
            placeholder={t('contact.emailPlaceholder')}
          />
        </Field>
      </div>

      <div style="margin-top:16px">
        <Field label={t('contact.message')} error={errorFor('message')}>
          <textarea
            class="input"
            name="message"
            maxLength={CONTACT_LIMITS.message}
            value={message}
            disabled={sending}
            aria-invalid={errorFor('message') ? 'true' : undefined}
            onInput={(event) => setMessage((event.target as HTMLTextAreaElement).value)}
            placeholder={t('contact.messagePlaceholder')}
            style="min-height:150px;line-height:1.75"
          />
        </Field>
      </div>

      {/* Not for people. Hidden from view, from tab order and from screen readers. */}
      <div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden">
        <label>
          {t('contact.company')}
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
          {t(sending ? 'contact.sending' : 'contact.send')}
        </button>
        <span
          role={status === 'error' ? 'alert' : undefined}
          style={`font-size:12px;line-height:1.6;color:${status === 'error' ? DANGER : MUTED}`}
        >
          {status === 'error' ? failure : t(siteKey ? 'contact.spamNote' : 'contact.notConfigured')}
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
