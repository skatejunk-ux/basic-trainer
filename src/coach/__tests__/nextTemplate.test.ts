import { describe, expect, it } from 'vitest';
import { nextTemplate } from '../nextTemplate';
import { session, template } from './fixtures';

const A = template('A', 0);
const B = template('B', 1);
const C = template('C', 2);

describe('nextTemplate', () => {
  it('geen templates → null', () => {
    expect(nextTemplate([], [])).toBeNull();
  });

  it('nooit iets gedaan → eerste op volgorde (ongeacht invoervolgorde)', () => {
    expect(nextTemplate([B, A], [])).toBe('A');
  });

  it('wisselt af: na A komt B, na B komt A', () => {
    expect(nextTemplate([A, B], [session('s1', 0, { templateId: 'A' })])).toBe('B');
    expect(
      nextTemplate([A, B], [session('s1', 0, { templateId: 'A' }), session('s2', 2, { templateId: 'B' })]),
    ).toBe('A');
  });

  it('nooit gedaan gaat voor, ook bij een later toegevoegd template C', () => {
    const sessions = [session('s1', 0, { templateId: 'A' }), session('s2', 2, { templateId: 'B' })];
    expect(nextTemplate([A, B, C], sessions)).toBe('C');
  });

  it('meerdere nooit-gedane → laagste order', () => {
    expect(nextTemplate([A, B, C], [session('s1', 0, { templateId: 'A' })])).toBe('B');
  });

  it('kiest het langst geleden gedane template', () => {
    const sessions = [
      session('s1', 0, { templateId: 'B' }),
      session('s2', 2, { templateId: 'C' }),
      session('s3', 4, { templateId: 'A' }),
      session('s4', 6, { templateId: 'B' }),
    ];
    expect(nextTemplate([A, B, C], sessions)).toBe('C');
  });

  it('afgebroken en actieve sessies tellen niet', () => {
    const sessions = [
      session('s1', 0, { templateId: 'A' }),
      session('s2', 2, { templateId: 'B', status: 'abandoned' }),
      session('s3', 3, { templateId: 'B', status: 'active' }),
    ];
    expect(nextTemplate([A, B], sessions)).toBe('B');
  });

  it('gebruikt endedAt, en anders startedAt', () => {
    const sessions = [
      session('s1', 2, { templateId: 'A', endedAt: undefined }),
      session('s2', 0, { templateId: 'B' }),
    ];
    expect(nextTemplate([A, B], sessions)).toBe('B');
  });

  it('gelijke tijd → volgorde beslist', () => {
    const sessions = [session('s1', 0, { templateId: 'B' }), session('s2', 0, { templateId: 'A' })];
    expect(nextTemplate([B, A], sessions)).toBe('A');
  });

  it('sessies van verwijderde templates worden genegeerd', () => {
    expect(nextTemplate([A, B], [session('s1', 0, { templateId: 'Z' })])).toBe('A');
  });
});
