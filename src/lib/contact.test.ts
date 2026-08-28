import { describe, expect, it } from 'vitest';
import {
  CONTACT_LIMITS,
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  escapeHtml,
  looksAutomated,
  singleLine,
  validateContact,
} from './contact';

const good = {
  name: 'Taner',
  email: 'taner@example.com',
  message: 'A message that is comfortably long enough to send.',
};

describe('validateContact', () => {
  it('accepts a filled in message', () => {
    expect(validateContact(good)).toEqual([]);
  });

  it('names every field that is missing', () => {
    const fields = validateContact({}).map((error) => error.field);
    expect(fields).toEqual(['name', 'email', 'message']);
  });

  it('treats whitespace as empty', () => {
    const fields = validateContact({ name: '   ', email: ' ', message: '  ' }).map((e) => e.field);
    expect(fields).toEqual(['name', 'email', 'message']);
  });

  it('rejects an address with no domain', () => {
    expect(validateContact({ ...good, email: 'taner@' })).toHaveLength(1);
  });

  it('accepts a plus addressed mailbox', () => {
    expect(validateContact({ ...good, email: 'taner+pm@example.co.uk' })).toEqual([]);
  });

  it('rejects a message that is barely there', () => {
    expect(validateContact({ ...good, message: 'hi' })[0]?.field).toBe('message');
  });

  it('rejects fields past their limit', () => {
    expect(validateContact({ ...good, name: 'a'.repeat(CONTACT_LIMITS.name + 1) })).toHaveLength(1);
    expect(
      validateContact({ ...good, message: 'a'.repeat(CONTACT_LIMITS.message + 1) }),
    ).toHaveLength(1);
  });
});

describe('looksAutomated', () => {
  it('lets a normal submission through', () => {
    expect(looksAutomated({ elapsed: MIN_FILL_MS + 1000 })).toBe(false);
  });

  it('catches a filled honeypot', () => {
    expect(looksAutomated({ elapsed: 20000, [HONEYPOT_FIELD]: 'Acme' })).toBe(true);
  });

  it('catches a submission that arrives too fast to have been typed', () => {
    expect(looksAutomated({ elapsed: 200 })).toBe(true);
  });

  it('catches a missing or nonsense timing', () => {
    expect(looksAutomated({})).toBe(true);
    expect(looksAutomated({ elapsed: Number.NaN })).toBe(true);
  });
});

describe('singleLine', () => {
  it('strips the line breaks that would forge mail headers', () => {
    expect(singleLine('Taner\r\nBcc: victim@example.com', 80)).toBe(
      'Taner Bcc: victim@example.com',
    );
  });

  it('trims to the limit', () => {
    expect(singleLine('a'.repeat(200), 10)).toHaveLength(10);
  });
});

describe('escapeHtml', () => {
  it('defuses markup in the delivered message', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
  });
});
