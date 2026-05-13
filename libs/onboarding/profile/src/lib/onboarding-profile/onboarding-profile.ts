import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { OnboardingService } from '@strategis/onboarding/shell';
import {
  ProfessionalProfileService,
  EntityType,
  GeoJsonPoint,
} from '@strategis/profiles/data-access';
import { User } from '@strategis/users/data-access';
import { applyApiErrors, parseJsonApiErrors } from '@strategis/common/http';
import {
  Button,
  GeoPoint,
  Input,
  PhoneInput,
  PlacesAutocomplete,
} from '@strategis/shared/ui';
import { ApiError } from '@vmelou/jsonapi';

const REQUIRES_REG_NUMBER: EntityType[] = [
  'company',
  'ngo',
  'public_institution',
];

function companyRegRequired(control: AbstractControl): ValidationErrors | null {
  const entityType: EntityType | undefined =
    control.parent?.get('entityType')?.value;
  if (
    entityType &&
    REQUIRES_REG_NUMBER.includes(entityType) &&
    !control.value
  ) {
    return { required: true };
  }
  return null;
}

@Component({
  selector: 'app-onboarding-profile',
  imports: [ReactiveFormsModule, Button, Input, PhoneInput, PlacesAutocomplete],
  templateUrl: './onboarding-profile.html',
  host: { class: 'flex flex-col min-w-sm' },
})
export class OnboardingProfile implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfessionalProfileService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly router = inject(Router);

  private entityTypeSubscription?: Subscription;

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly entityTypes: { value: EntityType; label: string }[] = [
    {
      value: 'individual',
      label: $localize`:@@onboardingProfile.entityType.individual:Individual`,
    },
    {
      value: 'company',
      label: $localize`:@@onboardingProfile.entityType.company:Company`,
    },
    { value: 'ngo', label: $localize`:@@onboardingProfile.entityType.ngo:NGO` },
    {
      value: 'public_institution',
      label: $localize`:@@onboardingProfile.entityType.publicInstitution:Public Institution`,
    },
    {
      value: 'other',
      label: $localize`:@@onboardingProfile.entityType.other:Other`,
    },
  ];

  readonly form = new FormGroup({
    companyName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    entityType: new FormControl<EntityType>('individual', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    companyRegistrationNumber: new FormControl('', {
      nonNullable: true,
      validators: [companyRegRequired],
    }),
    taxIdNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    address: new FormControl('', { nonNullable: true }),
    interventionZone: new FormControl('', { nonNullable: true }),
    location: new FormControl<GeoPoint | null>(null),
  });

  get companyName() {
    return this.form.controls.companyName;
  }
  get entityType() {
    return this.form.controls.entityType;
  }
  get companyRegistrationNumber() {
    return this.form.controls.companyRegistrationNumber;
  }
  get taxIdNumber() {
    return this.form.controls.taxIdNumber;
  }
  get phone() {
    return this.form.controls.phone;
  }
  get address() {
    return this.form.controls.address;
  }
  get interventionZone() {
    return this.form.controls.interventionZone;
  }
  get location() {
    return this.form.controls.location;
  }

  get requiresRegistrationNumber(): boolean {
    return REQUIRES_REG_NUMBER.includes(this.entityType.value);
  }

  get isEditing(): boolean {
    return this.onboardingService.profile() !== null;
  }

  ngOnInit(): void {
    this.entityTypeSubscription = this.entityType.valueChanges.subscribe(() => {
      this.companyRegistrationNumber.updateValueAndValidity();
    });

    const profile = this.onboardingService.profile();
    if (profile) {
      this.form.patchValue({
        companyName: profile.companyName ?? '',
        entityType: profile.entityType,
        companyRegistrationNumber: profile.companyRegistrationNumber ?? '',
        taxIdNumber: profile.taxIdNumber ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        interventionZone: profile.interventionZone ?? '',
        // location: skip — can't recover formattedAddress from coordinates without geocoder
      });
    }
  }

  ngOnDestroy(): void {
    this.entityTypeSubscription?.unsubscribe();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const {
      companyName,
      entityType,
      companyRegistrationNumber,
      taxIdNumber,
      phone,
      address,
      interventionZone,
      location: geoPoint,
    } = this.form.getRawValue();

    const location: GeoJsonPoint | null = geoPoint
      ? { type: 'Point', coordinates: [geoPoint.lng, geoPoint.lat] }
      : null;

    const existingProfile = this.onboardingService.profile();
    const data = {
      companyName,
      entityType,
      companyRegistrationNumber,
      taxIdNumber,
      phone,
      address,
      interventionZone,
      location,
    };
    const request$ = existingProfile
      ? this.profileService.update(existingProfile.id!, data)
      : this.profileService.create(data);

    request$.subscribe({
      next: (profile) => {
        const user = this.authService.currentUser();
        if (user) {
          this.authService.currentUser.set(new User({ ...user, profile }));
        }
        this.isLoading.set(false);
        this.router.navigate(['/onboarding/plan']);
      },
      error: (errors: ApiError[]) => {
        this.isLoading.set(false);
        const { fieldErrors, nonFieldErrors } = parseJsonApiErrors(errors);
        applyApiErrors(this.form, fieldErrors);
        this.errorMessage.set(nonFieldErrors[0] ?? null);
      },
    });
  }
}
