import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

@JsonResource('ActorType')
export class ActorType extends BaseResource {
  @JsonAttribute()
  name!: string;

  @JsonAttribute()
  slug!: string;

  @JsonAttribute()
  description!: string;

  @JsonAttribute()
  requiresValidation!: boolean;

  constructor(data?: Partial<ActorType>) {
    super(data);
    Object.assign(this, data);
  }
}
