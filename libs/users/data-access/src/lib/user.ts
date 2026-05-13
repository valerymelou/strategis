import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

import { ProfessionalProfile } from '@strategis/profiles/data-access';

@JsonResource('User')
export class User extends BaseResource {
  @JsonAttribute()
  email!: string;

  @JsonAttribute()
  firstName!: string;

  @JsonAttribute()
  lastName!: string;

  @JsonAttribute()
  isEmailVerified!: boolean;

  @JsonAttribute(ProfessionalProfile)
  profile?: ProfessionalProfile;

  constructor(data?: Partial<User>) {
    super(data);

    Object.assign(this, data);
  }

  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
