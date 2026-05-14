import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

import { ProfessionalProfile } from './professional-profile';

export type UpgradeRequestStatus =
  | 'pending'
  | 'activated'
  | 'rejected'
  | 'expired';

export type UpgradePlan = 'monthly' | 'annual';

@JsonResource('PremiumUpgradeRequest')
export class PremiumUpgradeRequest extends BaseResource {
  @JsonAttribute()
  status!: UpgradeRequestStatus;

  @JsonAttribute()
  plan!: UpgradePlan;

  @JsonAttribute()
  profileId!: string;

  @JsonAttribute(ProfessionalProfile)
  profile?: ProfessionalProfile;

  @JsonAttribute()
  activatedAt!: string;

  @JsonAttribute()
  expiresAt!: string;

  @JsonAttribute()
  rejectedAt!: string;

  @JsonAttribute()
  rejectionReason!: string;

  @JsonAttribute()
  created!: string;

  get statusLabel(): string {
    return (
      ({
        pending: $localize`:@@upgradeRequest.status.pending:Pending`,
        activated: $localize`:@@upgradeRequest.status.activated:Activated`,
        rejected: $localize`:@@upgradeRequest.status.rejected:Rejected`,
        expired: $localize`:@@upgradeRequest.status.expired:Expired`,
      } as Record<string, string>)[this.status] ?? this.status
    );
  }

  get statusVariant(): 'default' | 'secondary' | 'outline' | 'destructive' {
    return (
      ({
        pending: 'secondary',
        activated: 'default',
        rejected: 'destructive',
        expired: 'outline',
      } as const)[this.status] ?? 'outline'
    );
  }

  constructor(data?: Partial<PremiumUpgradeRequest>) {
    super(data);
    Object.assign(this, data);
  }
}
