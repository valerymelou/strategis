import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

import { ActorType } from './actor-type';
import { ActorDocument } from './actor-document';
import { ProfessionalProfile } from './professional-profile';

export type ActorStatus =
  | 'pending'
  | 'active'
  | 'rejected'
  | 'revoked'
  | 'awaiting_documents';

export type ActorReliabilityLevel =
  | 'certified'
  | 'validated_good_history'
  | 'validated'
  | 'declared'
  | 'not_validated';

export type ActorComplianceLevel =
  | 'approved'
  | 'validated'
  | 'compliant'
  | 'at_risk'
  | 'non_compliant';

@JsonResource('Actor')
export class Actor extends BaseResource {
  @JsonAttribute()
  status!: ActorStatus;

  @JsonAttribute()
  actorTypeId!: string;

  @JsonAttribute(ActorType)
  actorType?: ActorType;

  @JsonAttribute()
  profileId!: string;

  @JsonAttribute(ProfessionalProfile)
  profile?: ProfessionalProfile;

  @JsonAttribute()
  isAvailable!: boolean;

  @JsonAttribute()
  rejectionReason!: string;

  @JsonAttribute()
  revocationReason!: string;

  @JsonAttribute()
  validatedAt!: string;

  @JsonAttribute()
  reliabilityLevel!: ActorReliabilityLevel;

  @JsonAttribute()
  complianceLevel!: ActorComplianceLevel;

  @JsonAttribute()
  approvedForCategoryC!: boolean;

  @JsonAttribute()
  created!: string;

  @JsonAttribute(ActorDocument)
  documents?: ActorDocument[];

  get statusLabel(): string {
    return (
      ({
        pending: $localize`:@@actor.status.pending:Pending`,
        awaiting_documents: $localize`:@@actor.status.awaitingDocuments:Awaiting docs`,
        active: $localize`:@@actor.status.active:Active`,
        rejected: $localize`:@@actor.status.rejected:Rejected`,
        revoked: $localize`:@@actor.status.revoked:Revoked`,
      } as Record<string, string>)[this.status] ?? this.status
    );
  }

  get statusVariant(): 'default' | 'secondary' | 'outline' | 'destructive' {
    return (
      ({
        pending: 'secondary',
        awaiting_documents: 'outline',
        active: 'default',
        rejected: 'destructive',
        revoked: 'destructive',
      } as const)[this.status] ?? 'outline'
    );
  }

  constructor(data?: Partial<Actor>) {
    super(data);
    Object.assign(this, data);
  }
}
