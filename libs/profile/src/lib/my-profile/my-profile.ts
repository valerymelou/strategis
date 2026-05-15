import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '@strategis/auth/data-access';
import { applyApiErrors, parseJsonApiErrors } from '@strategis/common/http';
import {
  GeoJsonPoint,
  ProfessionalProfileService,
} from '@strategis/profiles/data-access';
import {
  Badge,
  Button,
  GeoPoint,
  Input,
  PhoneInput,
  PlacesAutocomplete,
  ToastService,
} from '@strategis/shared/ui';
import { User } from '@strategis/users/data-access';
import { ApiError } from '@vmelou/jsonapi';

@Component({
  selector: 'lib-my-profile',
  imports: [
    ReactiveFormsModule,
    Badge,
    Button,
    Input,
    PhoneInput,
    PlacesAutocomplete,
  ],
  templateUrl: './my-profile.html',
})
export class MyProfile {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfessionalProfileService);
  private readonly toast = inject(ToastService);

  readonly showEditForm = signal(false);
  readonly isSubmitting = signal(false);

  readonly profile = computed(() => this.authService.currentUser()?.profile);

  readonly form = new FormGroup({
    companyName: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    interventionZone: new FormControl('', { nonNullable: true }),
    location: new FormControl<GeoPoint | null>(null),
  });

  get companyName() {
    return this.form.controls.companyName;
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

  constructor() {
    effect(() => {
      if (this.showEditForm()) {
        this.patchForm();
      }
    });
  }

  patchForm(): void {
    const p = this.profile();
    if (!p) return;

    this.form.patchValue({
      companyName: p.companyName ?? '',
      phone: p.phone ?? '',
      address: p.address ?? '',
      interventionZone: p.interventionZone ?? '',
      // location: skip — cannot recover formattedAddress from coordinates without geocoder
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const p = this.profile();
    if (!p?.id) return;

    this.isSubmitting.set(true);

    const {
      companyName,
      phone,
      address,
      interventionZone,
      location: geoPoint,
    } = this.form.getRawValue();

    const location: GeoJsonPoint | null = geoPoint
      ? { type: 'Point', coordinates: [geoPoint.lng, geoPoint.lat] }
      : null;

    this.profileService
      .update(p.id, { companyName, phone, address, interventionZone, location })
      .subscribe({
        next: (updatedProfile) => {
          const user = this.authService.currentUser();
          if (user) {
            this.authService.currentUser.set(
              new User({ ...user, profile: updatedProfile }),
            );
          }
          this.isSubmitting.set(false);
          this.toast.success(
            $localize`:@@myProfile.submit.success:Profile updated successfully.`,
          );
          this.showEditForm.set(false);
        },
        error: (errors: ApiError[]) => {
          this.isSubmitting.set(false);
          const { fieldErrors, nonFieldErrors } = parseJsonApiErrors(errors);
          applyApiErrors(this.form, fieldErrors);
          this.toast.error(
            nonFieldErrors[0] ??
              $localize`:@@myProfile.submit.error:Something went wrong. Please try again.`,
          );
        },
      });
  }
}
