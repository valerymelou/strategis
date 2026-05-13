import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMixin } from '@vmelou/jsonapi-angular';

import { PremiumUpgradeRequest } from './premium-upgrade-request';

@Injectable({ providedIn: 'root' })
export class PremiumUpgradeRequestService {
  private readonly http = inject(HttpClient);

  private readonly createMixin = new CreateMixin<PremiumUpgradeRequest>(
    this.http,
    '/premium-upgrade-requests',
    PremiumUpgradeRequest,
  );

  requestUpgrade(
    profileId: string,
  ): Observable<PremiumUpgradeRequest> {
    return this.createMixin.create({ profileId });
  }
}
