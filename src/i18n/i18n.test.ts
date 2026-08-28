import { describe, expect, it } from 'vitest';
import { en } from './en';
import { tr } from './tr';
import { translator } from './index';
import { alternateOf, routeOf, to } from './routing';
import { legalPage } from '~/data/legal';

describe('dictionaries', () => {
  it('covers every English key in Turkish', () => {
    expect(Object.keys(tr).sort()).toEqual(Object.keys(en).sort());
  });

  it('leaves no string empty', () => {
    for (const [key, value] of Object.entries(tr)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('keeps the same placeholders on both sides', () => {
    const holes = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(holes(tr[key]), key).toEqual(holes(en[key]));
    }
  });

  it('has not left a Turkish string identical to a long English one', () => {
    // Short labels legitimately match, brand names above all. Long prose does not.
    const suspicious = (Object.keys(en) as (keyof typeof en)[]).filter(
      (key) => en[key].length > 40 && tr[key] === en[key],
    );
    expect(suspicious).toEqual([]);
  });
});

describe('translator', () => {
  it('fills the holes it is given', () => {
    expect(translator('en')('app.deleteTitle', { name: 'Q3 Launch' })).toBe('Delete Q3 Launch?');
    expect(translator('tr')('app.deleteTitle', { name: 'Q3 Launch' })).toBe(
      'Q3 Launch silinsin mi?',
    );
  });

  it('leaves a hole alone when nothing is supplied for it', () => {
    expect(translator('en')('app.deleteTitle')).toContain('{name}');
  });
});

describe('routing', () => {
  it('prefixes only Turkish', () => {
    expect(to('/app', 'en')).toBe('/app');
    expect(to('/app', 'tr')).toBe('/tr/app');
    expect(to('/', 'en')).toBe('/');
    expect(to('/', 'tr')).toBe('/tr');
  });

  it('strips the prefix back off', () => {
    expect(routeOf('/tr/privacy')).toBe('/privacy');
    expect(routeOf('/tr/')).toBe('/');
    expect(routeOf('/privacy/')).toBe('/privacy');
    expect(routeOf('/')).toBe('/');
  });

  it('points each page at its counterpart', () => {
    expect(alternateOf('/app', 'en')).toBe('/tr/app');
    expect(alternateOf('/tr/app', 'tr')).toBe('/app');
    expect(alternateOf('/', 'en')).toBe('/tr');
    expect(alternateOf('/tr', 'tr')).toBe('/');
  });

  it('does not mistake a route that merely starts with tr', () => {
    expect(routeOf('/terms')).toBe('/terms');
    expect(alternateOf('/terms', 'en')).toBe('/tr/terms');
  });
});

describe('legal pages', () => {
  it('carries the same sections in both languages', () => {
    for (const slug of ['privacy', 'terms', 'cookies'] as const) {
      expect(legalPage('tr', slug).body).toHaveLength(legalPage('en', slug).body.length);
      expect(legalPage('tr', slug).title).not.toBe(legalPage('en', slug).title);
    }
  });
});
