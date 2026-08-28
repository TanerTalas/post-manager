/**
 * Shared between the browser and the Pages Function, so the form and the
 * endpoint never disagree about what counts as a valid message. The client
 * check is a courtesy; the server repeats all of it and is the real gate.
 */

export const CONTACT_LIMITS = {
  name: 80,
  email: 160,
  message: 4000,
  messageMin: 10,
  /** Largest request body the endpoint will read, in bytes. */
  body: 16 * 1024,
} as const;

/** Field a person never sees. Anything filling it in is not a person. */
export const HONEYPOT_FIELD = 'company';

/** How long a genuine visitor takes, at the very least, to write and send. */
export const MIN_FILL_MS = 3000;

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  token: string;
  elapsed: number;
  [HONEYPOT_FIELD]?: string;
}

export type ContactField = 'name' | 'email' | 'message' | 'token';

export interface ValidationError {
  field: ContactField;
  message: string;
}

// Deliberately loose. The address only has to be plausible enough to reply to,
// and a stricter pattern rejects real addresses more often than it stops spam.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: Partial<ContactPayload>): ValidationError[] {
  const errors: ValidationError[] = [];

  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim();
  const message = (input.message ?? '').trim();

  if (!name) {
    errors.push({ field: 'name', message: 'Tell me what to call you.' });
  } else if (name.length > CONTACT_LIMITS.name) {
    errors.push({ field: 'name', message: `Names cap out at ${CONTACT_LIMITS.name} characters.` });
  }

  if (!email) {
    errors.push({ field: 'email', message: 'I need somewhere to write back.' });
  } else if (email.length > CONTACT_LIMITS.email || !EMAIL.test(email)) {
    errors.push({ field: 'email', message: 'That address does not look right.' });
  }

  if (!message) {
    errors.push({ field: 'message', message: 'The message is empty.' });
  } else if (message.length < CONTACT_LIMITS.messageMin) {
    errors.push({ field: 'message', message: 'A few more words would help.' });
  } else if (message.length > CONTACT_LIMITS.message) {
    errors.push({
      field: 'message',
      message: `That is over ${CONTACT_LIMITS.message.toLocaleString('en-US')} characters.`,
    });
  }

  return errors;
}

/** True when the submission carries the marks of a bot rather than a person. */
export function looksAutomated(input: Partial<ContactPayload>): boolean {
  const honeypot = input[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return true;

  const elapsed = input.elapsed;
  if (typeof elapsed !== 'number' || !Number.isFinite(elapsed)) return true;

  return elapsed < MIN_FILL_MS;
}

/**
 * Header values must never carry line breaks: a newline in a name is how a
 * submission smuggles extra headers into the outgoing mail.
 */
export function singleLine(value: string, limit: number): string {
  return value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, limit);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
