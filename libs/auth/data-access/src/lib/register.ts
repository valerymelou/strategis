import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

@JsonResource('Register')
export class Register extends BaseResource {
  @JsonAttribute() email!: string;
  @JsonAttribute() firstName!: string;
  @JsonAttribute() lastName!: string;
  @JsonAttribute() isEmailVerified!: boolean;
  @JsonAttribute() password!: string;

  constructor(data?: Partial<Register>) {
    super(data);
    Object.assign(this, data);
  }
}
