import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

@JsonResource('User')
export class User extends BaseResource {
  @JsonAttribute()
  email!: string;

  @JsonAttribute()
  name!: string;

  constructor(data?: Partial<User>) {
    super(data);

    Object.assign(this, data);
  }
}
