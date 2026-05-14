import '@angular/localize/init';
import { PremiumUpgradeRequest, UpgradeRequestStatus } from './premium-upgrade-request';

describe('PremiumUpgradeRequest model', () => {
  function makeRequest(status: UpgradeRequestStatus): PremiumUpgradeRequest {
    return Object.assign(new PremiumUpgradeRequest(), { status });
  }

  describe('statusLabel', () => {
    it.each([
      ['pending', 'Pending'],
      ['activated', 'Activated'],
      ['rejected', 'Rejected'],
      ['expired', 'Expired'],
    ] as [UpgradeRequestStatus, string][])(
      'returns "%s" label for status "%s"',
      (status, expected) => {
        expect(makeRequest(status).statusLabel).toBe(expected);
      },
    );

    it('falls back to raw status for unknown value', () => {
      const req = Object.assign(new PremiumUpgradeRequest(), {
        status: 'unknown' as UpgradeRequestStatus,
      });
      expect(req.statusLabel).toBe('unknown');
    });
  });

  describe('statusVariant', () => {
    it.each([
      ['pending', 'secondary'],
      ['activated', 'default'],
      ['rejected', 'destructive'],
      ['expired', 'outline'],
    ] as [UpgradeRequestStatus, string][])(
      'returns "%s" variant for status "%s"',
      (status, expected) => {
        expect(makeRequest(status).statusVariant).toBe(expected);
      },
    );

    it('falls back to "outline" for unknown status', () => {
      const req = Object.assign(new PremiumUpgradeRequest(), {
        status: 'unknown' as UpgradeRequestStatus,
      });
      expect(req.statusVariant).toBe('outline');
    });
  });
});
