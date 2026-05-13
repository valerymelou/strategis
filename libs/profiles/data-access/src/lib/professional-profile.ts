import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

import { Actor } from './actor';

export type EntityType =
  | 'individual'
  | 'company'
  | 'ngo'
  | 'public_institution'
  | 'other';

export type ProfileTier = 'FREE' | 'PREMIUM';

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

@JsonResource('ProfessionalProfile')
export class ProfessionalProfile extends BaseResource {
  @JsonAttribute()
  companyName!: string;

  @JsonAttribute()
  entityType!: EntityType;

  @JsonAttribute()
  companyRegistrationNumber!: string;

  @JsonAttribute()
  taxIdNumber!: string;

  @JsonAttribute()
  phone!: string;

  @JsonAttribute()
  address!: string;

  @JsonAttribute()
  interventionZone!: string;

  @JsonAttribute()
  location!: GeoJsonPoint | null;

  @JsonAttribute()
  tier!: ProfileTier;

  @JsonAttribute()
  isActive!: boolean;

  @JsonAttribute(Actor)
  actors?: Actor[];

  constructor(data?: Partial<ProfessionalProfile>) {
    super(data);
    Object.assign(this, data);
  }
}
