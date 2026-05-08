import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

@JsonResource('User')
export class User extends BaseResource {
  @JsonAttribute()
  email!: string;

  @JsonAttribute()
  firstName!: string;

  @JsonAttribute()
  lastName!: string;

  constructor(data?: Partial<User>) {
    super(data);

    Object.assign(this, data);
  }

  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
