// Volgende training kiezen (PLAN.md §7): het template dat het langst geleden is gedaan.
import type { Session, Template } from '../types';

/**
 * Nooit gedaan gaat voor (op `order`), daarna het langst geleden gedane template.
 * Alleen afgeronde sessies ('done') tellen. Geen templates → null.
 */
export function nextTemplate(templates: Template[], sessions: Session[]): string | null {
  if (templates.length === 0) return null;
  const lastDone = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== 'done') continue;
    const t = s.endedAt ?? s.startedAt;
    lastDone.set(s.templateId, Math.max(lastDone.get(s.templateId) ?? Number.NEGATIVE_INFINITY, t));
  }
  const sorted = [...templates].sort((a, b) => {
    const ta = lastDone.get(a.id) ?? Number.NEGATIVE_INFINITY;
    const tb = lastDone.get(b.id) ?? Number.NEGATIVE_INFINITY;
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.order - b.order;
  });
  return sorted[0].id;
}
