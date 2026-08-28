import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  CONTACT_LIMITS,
  escapeHtml,
  looksAutomated,
  singleLine,
  validateContact,
  type ContactPayload,
} from '../src/lib/contact';

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Post Manager <onboarding@resend.dev>';

export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);

  try {
    const response = await fetch(TURNSTILE_VERIFY, { method: 'POST', body: form });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export async function sendEmail(
  key: string,
  to: string,
  from: string,
  payload: ContactPayload,
): Promise<boolean> {
  const name = singleLine(payload.name, CONTACT_LIMITS.name);
  const email = singleLine(payload.email, CONTACT_LIMITS.email);
  const message = payload.message.trim().slice(0, CONTACT_LIMITS.message);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Post Manager: ${name}`,
        text: `${name} <${email}> wrote:\n\n${message}\n`,
        html:
          `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt; wrote:</p>` +
          `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface Config {
  turnstileSecret: string | undefined;
  resendKey: string | undefined;
  to: string | undefined;
  from: string;
}

export function readConfig(env: NodeJS.ProcessEnv): Config {
  return {
    turnstileSecret: env.TURNSTILE_SECRET_KEY,
    resendKey: env.RESEND_API_KEY,
    to: env.CONTACT_TO,
    from: env.CONTACT_FROM || DEFAULT_FROM,
  };
}

export interface Reply {
  status: number;
  body: unknown;
}

/**
 * The whole decision, with no Vercel types in sight, so it can be exercised
 * directly by the tests instead of only in a deployed function.
 *
 * The order matters: cheap checks first, then the two calls that cost something.
 * A bot never reaches the mailer.
 */
export async function handleContact(
  config: Config,
  raw: unknown,
  ip: string | null,
  deps = { verifyTurnstile, sendEmail },
): Promise<Reply> {
  if (!config.turnstileSecret || !config.resendKey || !config.to) {
    return { status: 503, body: { error: 'The contact endpoint is not configured yet.' } };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { status: 400, body: { error: 'That request could not be read.' } };
  }

  const payload = raw as Partial<ContactPayload>;

  // Bots get the same answer a person gets, so a failed attempt teaches nothing.
  if (looksAutomated(payload)) {
    return { status: 200, body: { ok: true } };
  }

  const errors = validateContact(payload);
  if (errors.length) {
    return { status: 422, body: { errors } };
  }

  const token = typeof payload.token === 'string' ? payload.token : '';
  if (!token) {
    return {
      status: 422,
      body: { errors: [{ field: 'token', message: 'Finish the spam check first.' }] },
    };
  }

  if (!(await deps.verifyTurnstile(config.turnstileSecret, token, ip))) {
    return {
      status: 403,
      body: { errors: [{ field: 'token', message: 'That spam check did not pass. Try once more.' }] },
    };
  }

  const sent = await deps.sendEmail(
    config.resendKey,
    config.to,
    config.from,
    payload as ContactPayload,
  );

  if (!sent) {
    return {
      status: 502,
      body: { error: 'The message could not be delivered. Try again in a moment.' },
    };
  }

  return { status: 200, body: { ok: true } };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('cache-control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('allow', 'POST');
    response.status(405).send('Method not allowed');
    return;
  }

  const length = Number(request.headers['content-length'] ?? '0');
  if (length > CONTACT_LIMITS.body) {
    response.status(413).json({ error: 'That message is too long to send.' });
    return;
  }

  const forwarded = request.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ?? null;

  const reply = await handleContact(readConfig(process.env), request.body, ip);
  response.status(reply.status).json(reply.body);
}
