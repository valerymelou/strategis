import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

@JsonResource('ActorDocument')
export class ActorDocument extends BaseResource {
  @JsonAttribute()
  actorId!: string;

  @JsonAttribute()
  label!: string;

  @JsonAttribute()
  file!: string;

  @JsonAttribute()
  isRequired!: boolean;

  @JsonAttribute()
  uploadedAt!: string;

  @JsonAttribute()
  adminNote!: string;

  constructor(data?: Partial<ActorDocument>) {
    super(data);
    Object.assign(this, data);
  }
}
