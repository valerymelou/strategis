import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

import { ActorType } from './actor-type';

export type ActorStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'REVOKED'
  | 'AWAITING_DOCUMENTS';

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

  constructor(data?: Partial<Actor>) {
    super(data);
    Object.assign(this, data);
  }
}
