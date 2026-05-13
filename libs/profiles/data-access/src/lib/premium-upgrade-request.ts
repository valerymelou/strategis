import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

export type UpgradeRequestStatus =
  | 'PENDING'
  | 'ACTIVATED'
  | 'REJECTED'
  | 'EXPIRED';

export type UpgradePlan = 'MONTHLY' | 'ANNUAL';

@JsonResource('PremiumUpgradeRequest')
export class PremiumUpgradeRequest extends BaseResource {
  @JsonAttribute()
  status!: UpgradeRequestStatus;

  @JsonAttribute()
  plan!: UpgradePlan;

  @JsonAttribute()
  profileId!: string;

  constructor(data?: Partial<PremiumUpgradeRequest>) {
    super(data);
    Object.assign(this, data);
  }
}
