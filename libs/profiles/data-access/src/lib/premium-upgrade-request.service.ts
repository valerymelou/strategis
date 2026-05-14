import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMixin, ListMixin, RetrieveMixin } from '@vmelou/jsonapi-angular';
import { Results } from '@vmelou/jsonapi';

import { PremiumUpgradeRequest, UpgradePlan } from './premium-upgrade-request';

@Injectable({ providedIn: 'root' })
export class PremiumUpgradeRequestService {
  private readonly http = inject(HttpClient);

  private readonly createMixin = new CreateMixin<PremiumUpgradeRequest>(
    this.http,
    '/premium-upgrade-requests',
    PremiumUpgradeRequest,
  );
  private readonly listMixin = new ListMixin<PremiumUpgradeRequest>(
    this.http,
    '/premium-upgrade-requests',
    PremiumUpgradeRequest,
  );
  private readonly retrieveMixin = new RetrieveMixin<PremiumUpgradeRequest>(
    this.http,
    '/premium-upgrade-requests',
    PremiumUpgradeRequest,
  );

  requestUpgrade(profileId: string): Observable<PremiumUpgradeRequest> {
    return this.createMixin.create({ profileId });
  }

  listAll(query: { [key: string]: string } = {}): Observable<Results<PremiumUpgradeRequest>> {
    return this.listMixin.list({ ...query, include: 'profile' });
  }

  retrieve(id: string): Observable<PremiumUpgradeRequest> {
    return this.retrieveMixin.retrieve(id, ['profile']);
  }

  activate(id: string, plan: UpgradePlan): Observable<void> {
    return this.http.post<void>(`/premium-upgrade-requests/${id}/activate/`, {
      data: { type: 'PremiumUpgradeRequest', id, attributes: { plan } },
    });
  }

  reject(id: string, rejectionReason: string): Observable<void> {
    return this.http.post<void>(`/premium-upgrade-requests/${id}/reject/`, {
      data: { type: 'PremiumUpgradeRequest', id, attributes: { rejection_reason: rejectionReason } },
    });
  }
}
