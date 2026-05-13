import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { OnboardingService } from '@strategis/onboarding/shell';
import {
  ProfessionalProfile,
  ProfessionalProfileService,
} from '@strategis/profiles/data-access';
import { GOOGLE_MAPS_API_KEY_TOKEN } from '@strategis/shared/ui';
import { User } from '@strategis/users/data-access';
import { OnboardingProfile } from './onboarding-profile';

const VALID_FORM = {
  companyName: 'Acme Corp',
  entityType: 'individual' as const,
  companyRegistrationNumber: '',
  taxIdNumber: 'M123456789',
  phone: '+237600000000',
  address: '',
  interventionZone: '',
  location: null,
};

const SAVED_PROFILE = Object.assign(new ProfessionalProfile(), {
  id: 'profile-1',
  companyName: 'Old Corp',
  entityType: 'company' as const,
  companyRegistrationNumber: 'RC/DLA/2021/B/1234',
  taxIdNumber: 'M999',
  phone: '+237699000000',
  address: 'Rue de la Paix',
  interventionZone: 'Littoral',
});

async function setupTestBed(existingProfile: ProfessionalProfile | null = null) {
  const profileSignal = signal<ProfessionalProfile | null>(existingProfile);
  const profileService: jest.Mocked<Partial<ProfessionalProfileService>> = {
    create: jest.fn().mockReturnValue(of(SAVED_PROFILE)),
    update: jest.fn().mockReturnValue(of(SAVED_PROFILE)),
  };

  await TestBed.configureTestingModule({
    imports: [OnboardingProfile],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: '**', redirectTo: '' }]),
      { provide: ProfessionalProfileService, useValue: profileService },
      {
        provide: OnboardingService,
        useValue: {
          profile: profileSignal,
          hasProfile: () => existingProfile !== null,
          hasActor: () => false,
        },
      },
      { provide: AuthService, useValue: { currentUser: signal<User | null>(null) } },
      { provide: GOOGLE_MAPS_API_KEY_TOKEN, useValue: '' },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OnboardingProfile);
  const component = fixture.componentInstance;
  const router = TestBed.inject(Router);
  await fixture.whenStable();

  return { fixture, component, router, profileService };
}

describe('OnboardingProfile — new user', () => {
  let component: OnboardingProfile;
  let fixture: ComponentFixture<OnboardingProfile>;
  let profileService: jest.Mocked<Partial<ProfessionalProfileService>>;
  let router: Router;

  beforeEach(async () => {
    ({ component, fixture, profileService, router } = await setupTestBed(null));
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit when required fields are empty', () => {
    component.submit();
    expect(profileService.create).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('requires companyRegistrationNumber for company entity type', () => {
    component.form.patchValue({ entityType: 'company', companyRegistrationNumber: '' });
    component.companyRegistrationNumber.updateValueAndValidity();
    expect(component.companyRegistrationNumber.valid).toBe(false);
  });

  it('does not require companyRegistrationNumber for individual entity type', () => {
    component.form.patchValue({ entityType: 'individual', companyRegistrationNumber: '' });
    component.companyRegistrationNumber.updateValueAndValidity();
    expect(component.companyRegistrationNumber.valid).toBe(true);
  });

  it('calls profileService.create with form values on valid submit', () => {
    component.form.setValue(VALID_FORM);
    component.submit();

    expect(profileService.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Acme Corp', entityType: 'individual' }),
    );
    expect(profileService.update).not.toHaveBeenCalled();
  });

  it('navigates to /onboarding/plan after successful create', async () => {
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue(VALID_FORM);
    component.submit();
    await fixture.whenStable();
    expect(spy).toHaveBeenCalledWith(['/onboarding/plan']);
  });

  it('shows non-field server error when create fails', async () => {
    (profileService.create as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'Something went wrong.' }]),
    );
    component.form.setValue(VALID_FORM);
    component.submit();
    await fixture.whenStable();
    expect(component.errorMessage()).toBe('Something went wrong.');
  });

  it('applies field-level server error to the relevant control', async () => {
    (profileService.create as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'Tax ID already used.', source: 'taxIdNumber' }]),
    );
    component.form.setValue(VALID_FORM);
    component.submit();
    await fixture.whenStable();
    expect(component.taxIdNumber.getError('apiError')).toBe('Tax ID already used.');
  });

  it('resets loading state after error', async () => {
    (profileService.create as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'Error.' }]),
    );
    component.form.setValue(VALID_FORM);
    component.submit();
    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
  });

  it('isEditing is false when no profile exists', () => {
    expect(component.isEditing).toBe(false);
  });
});

describe('OnboardingProfile — editing existing profile', () => {
  let component: OnboardingProfile;
  let fixture: ComponentFixture<OnboardingProfile>;
  let profileService: jest.Mocked<Partial<ProfessionalProfileService>>;
  let router: Router;

  beforeEach(async () => {
    ({ component, fixture, profileService, router } = await setupTestBed(SAVED_PROFILE));
  });

  it('prefills form with existing profile data on init', () => {
    expect(component.companyName.value).toBe('Old Corp');
    expect(component.entityType.value).toBe('company');
    expect(component.taxIdNumber.value).toBe('M999');
    expect(component.phone.value).toBe('+237699000000');
    expect(component.address.value).toBe('Rue de la Paix');
    expect(component.interventionZone.value).toBe('Littoral');
  });

  it('isEditing is true when profile exists', () => {
    expect(component.isEditing).toBe(true);
  });

  it('calls profileService.update (not create) on submit', async () => {
    component.submit();
    await fixture.whenStable();
    expect(profileService.update).toHaveBeenCalledWith('profile-1', expect.any(Object));
    expect(profileService.create).not.toHaveBeenCalled();
  });

  it('navigates to /onboarding/plan after successful update', async () => {
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.submit();
    await fixture.whenStable();
    expect(spy).toHaveBeenCalledWith(['/onboarding/plan']);
  });
});
