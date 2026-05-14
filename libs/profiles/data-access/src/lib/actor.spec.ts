import '@angular/localize/init';
import { Actor, ActorStatus } from './actor';

describe('Actor model', () => {
  function makeActor(status: ActorStatus): Actor {
    return Object.assign(new Actor(), { status });
  }

  describe('statusLabel', () => {
    it.each([
      ['pending', 'Pending'],
      ['awaiting_documents', 'Awaiting docs'],
      ['active', 'Active'],
      ['rejected', 'Rejected'],
      ['revoked', 'Revoked'],
    ] as [ActorStatus, string][])(
      'returns "%s" label for status "%s"',
      (status, expected) => {
        expect(makeActor(status).statusLabel).toBe(expected);
      },
    );

    it('falls back to raw status for unknown value', () => {
      const actor = Object.assign(new Actor(), { status: 'unknown' as ActorStatus });
      expect(actor.statusLabel).toBe('unknown');
    });
  });

  describe('statusVariant', () => {
    it.each([
      ['pending', 'secondary'],
      ['awaiting_documents', 'outline'],
      ['active', 'default'],
      ['rejected', 'destructive'],
      ['revoked', 'destructive'],
    ] as [ActorStatus, string][])(
      'returns "%s" variant for status "%s"',
      (status, expected) => {
        expect(makeActor(status).statusVariant).toBe(expected);
      },
    );

    it('falls back to "outline" for unknown status', () => {
      const actor = Object.assign(new Actor(), { status: 'unknown' as ActorStatus });
      expect(actor.statusVariant).toBe('outline');
    });
  });
});
