import {
  CONTACT_LIMITS,
  escapeHtml,
  looksAutomated,
  singleLine,
  validateContact,
  type ContactPayload,
} from '../../src/lib/contact';

interface Env {
  /** Turnstile server key. Never leaves the Function. */
  TURNSTILE_SECRET_KEY: string;
  /** Resend API key. */
  RESEND_API_KEY: string;
  /** Inbox the messages land in. */
  CONTACT_TO: string;
  /** Verified sender. Falls back to Resend's shared testing sender. */
  CONTACT_FROM?: string;
  /** Optional. Bind a KV namespace to cap submissions per address. */
  RATE_LIMIT?: KVNamespace;
}

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Post Manager <onboarding@resend.dev>';

/** Submissions allowed from one address before it has to wait. */
const RATE_MAX = 5;
const RATE_WINDOW_SECONDS = 60 * 60;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function verifyTurnstile(env: Env, token: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET_KEY);
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

/**
 * A quiet second line behind Turnstile, for the case where a token is being
 * replayed by something that solved the challenge once. Skipped entirely when
 * no KV namespace is bound, so the endpoint works before that is set up.
 */
async function overRateLimit(env: Env, ip: string | null): Promise<boolean> {
  if (!env.RATE_LIMIT || !ip) return false;

  const key = `contact:${ip}`;
  try {
    const seen = Number((await env.RATE_LIMIT.get(key)) ?? '0');
    if (seen >= RATE_MAX) return true;
    await env.RATE_LIMIT.put(key, String(seen + 1), { expirationTtl: RATE_WINDOW_SECONDS });
    return false;
  } catch {
    // Losing the counter is not a reason to lose the message.
    return false;
  }
}

async function sendEmail(env: Env, payload: ContactPayload): Promise<boolean> {
  const name = singleLine(payload.name, CONTACT_LIMITS.name);
  const email = singleLine(payload.email, CONTACT_LIMITS.email);
  const message = payload.message.trim().slice(0, CONTACT_LIMITS.message);

  const body = {
    from: env.CONTACT_FROM || DEFAULT_FROM,
    to: [env.CONTACT_TO],
    reply_to: email,
    subject: `Post Manager: ${name}`,
    text: `${name} <${email}> wrote:\n\n${message}\n`,
    html:
      `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt; wrote:</p>` +
      `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  };

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Every method is handled here rather than through onRequestPost, because an
 * unhandled method falls through to the static assets and answers a probe with
 * the home page instead of a refusal.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { allow: 'POST', 'cache-control': 'no-store' },
    });
  }
  return handle(context);
};

const handle: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_TO) {
    return json({ error: 'The contact endpoint is not configured yet.' }, 503);
  }

  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > CONTACT_LIMITS.body) {
    return json({ error: 'That message is too long to send.' }, 413);
  }

  let payload: Partial<ContactPayload>;
  try {
    payload = (await request.json()) as Partial<ContactPayload>;
  } catch {
    return json({ error: 'That request could not be read.' }, 400);
  }

  // Bots get the same answer a person gets, so a failed attempt teaches nothing.
  if (looksAutomated(payload)) {
    return json({ ok: true }, 200);
  }

  const errors = validateContact(payload);
  if (errors.length) {
    return json({ errors }, 422);
  }

  const token = typeof payload.token === 'string' ? payload.token : '';
  if (!token) {
    return json({ errors: [{ field: 'token', message: 'Finish the spam check first.' }] }, 422);
  }

  const ip = request.headers.get('cf-connecting-ip');

  if (!(await verifyTurnstile(env, token, ip))) {
    return json(
      { errors: [{ field: 'token', message: 'That spam check did not pass. Try once more.' }] },
      403,
    );
  }

  if (await overRateLimit(env, ip)) {
    return json({ error: 'That is a few messages in a short while. Try again later.' }, 429);
  }

  const sent = await sendEmail(env, payload as ContactPayload);
  if (!sent) {
    return json({ error: 'The message could not be delivered. Try again in a moment.' }, 502);
  }

  return json({ ok: true }, 200);
};
