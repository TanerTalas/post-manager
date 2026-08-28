import { describe, expect, it, vi } from 'vitest';
import { handleContact, readConfig, type Config } from './contact';

const config: Config = {
  turnstileSecret: 'secret',
  resendKey: 'key',
  to: 'inbox@example.com',
  from: 'Post Manager <onboarding@resend.dev>',
};

const good = {
  name: 'Taner',
  email: 'taner@example.com',
  message: 'A message that is comfortably long enough to send.',
  token: 'a-solved-challenge',
  elapsed: 9000,
};

function deps(overrides: Partial<{ turnstile: boolean; sent: boolean }> = {}) {
  return {
    verifyTurnstile: vi.fn(async () => overrides.turnstile ?? true),
    sendEmail: vi.fn(async () => overrides.sent ?? true),
  };
}

describe('handleContact', () => {
  it('delivers a well formed message', async () => {
    const spies = deps();
    const reply = await handleContact(config, good, '203.0.113.4', spies);

    expect(reply).toEqual({ status: 200, body: { ok: true } });
    expect(spies.verifyTurnstile).toHaveBeenCalledWith('secret', good.token, '203.0.113.4');
    expect(spies.sendEmail).toHaveBeenCalledOnce();
  });

  it('refuses to run at all when the deployment has no keys', async () => {
    const spies = deps();
    const reply = await handleContact({ ...config, resendKey: undefined }, good, null, spies);

    expect(reply.status).toBe(503);
    expect(spies.verifyTurnstile).not.toHaveBeenCalled();
  });

  it('rejects a body that is not an object', async () => {
    expect((await handleContact(config, 'not json', null, deps())).status).toBe(400);
  });

  it('answers a filled honeypot as if it worked, and sends nothing', async () => {
    const spies = deps();
    const reply = await handleContact(config, { ...good, company: 'Acme' }, null, spies);

    expect(reply).toEqual({ status: 200, body: { ok: true } });
    expect(spies.verifyTurnstile).not.toHaveBeenCalled();
    expect(spies.sendEmail).not.toHaveBeenCalled();
  });

  it('answers a submission that arrived too fast the same way', async () => {
    const spies = deps();
    const reply = await handleContact(config, { ...good, elapsed: 150 }, null, spies);

    expect(reply).toEqual({ status: 200, body: { ok: true } });
    expect(spies.sendEmail).not.toHaveBeenCalled();
  });

  it('reports field problems without spending a challenge', async () => {
    const spies = deps();
    const reply = await handleContact(config, { ...good, email: 'nope' }, null, spies);

    expect(reply.status).toBe(422);
    expect(spies.verifyTurnstile).not.toHaveBeenCalled();
  });

  it('asks for the challenge when none was sent', async () => {
    const reply = await handleContact(config, { ...good, token: '' }, null, deps());
    expect(reply.status).toBe(422);
  });

  it('stops at a failed challenge and never reaches the mailer', async () => {
    const spies = deps({ turnstile: false });
    const reply = await handleContact(config, good, null, spies);

    expect(reply.status).toBe(403);
    expect(spies.sendEmail).not.toHaveBeenCalled();
  });

  it('reports a mailer that would not take the message', async () => {
    const reply = await handleContact(config, good, null, deps({ sent: false }));
    expect(reply.status).toBe(502);
  });
});

describe('readConfig', () => {
  it('falls back to the shared sender until a domain is verified', () => {
    expect(readConfig({}).from).toBe('Post Manager <onboarding@resend.dev>');
  });

  it('prefers a configured sender', () => {
    expect(readConfig({ CONTACT_FROM: 'Me <me@site.com>' }).from).toBe('Me <me@site.com>');
  });
});
