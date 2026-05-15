import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { AuthService } from '@strategis/auth/data-access';
import { ProfessionalProfile, ProfessionalProfileService } from '@strategis/profiles/data-access';
import { GOOGLE_MAPS_API_KEY_TOKEN, ToastService } from '@strategis/shared/ui';
import { User } from '@strategis/users/data-access';
import { ApiError } from '@vmelou/jsonapi';

import { MyProfile } from './my-profile';

function makeProfile(overrides: Partial<ProfessionalProfile> = {}): ProfessionalProfile {
  return Object.assign(new ProfessionalProfile(), {
    id: 'profile-1',
    companyName: 'Acme Corp',
    entityType: 'company',
    companyRegistrationNumber: 'RC/123',
    taxIdNumber: 'TAX123',
    phone: '+237600000000',
    address: '123 Main St',
    interventionZone: 'Littoral',
    location: null,
    tier: 'FREE',
    isActive: true,
    ...overrides,
  });
}

function makeUser(profile?: ProfessionalProfile): User {
  return Object.assign(new User(), {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isEmailVerified: true,
    isStaff: false,
    profile,
  });
}

describe('MyProfile', () => {
  let component: MyProfile;
  let fixture: ComponentFixture<MyProfile>;
  let authService: { currentUser: ReturnType<typeof signal<User | null>> };
  let profileService: { update: jest.Mock };
  let toastService: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    const currentUserSignal = signal<User | null>(makeUser(makeProfile()));

    authService = {
      currentUser: currentUserSignal,
    };

    profileService = {
      update: jest.fn().mockReturnValue(of(makeProfile())),
    };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [MyProfile],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ProfessionalProfileService, useValue: profileService },
        { provide: ToastService, useValue: toastService },
        { provide: GOOGLE_MAPS_API_KEY_TOKEN, useValue: '' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('profile()', () => {
    it('returns profile from currentUser signal', () => {
      const profile = component.profile();
      expect(profile?.id).toBe('profile-1');
      expect(profile?.companyName).toBe('Acme Corp');
    });

    it('returns undefined when currentUser has no profile', () => {
      authService.currentUser.set(makeUser());
      expect(component.profile()).toBeUndefined();
    });
  });

  describe('showEditForm', () => {
    it('starts as false', () => {
      expect(component.showEditForm()).toBe(false);
    });

    it('patches form values when switched to true', async () => {
      component.showEditForm.set(true);
      await fixture.whenStable();
      expect(component.form.controls.companyName.value).toBe('Acme Corp');
      expect(component.form.controls.phone.value).toBe('+237600000000');
    });
  });

  describe('submit()', () => {
    beforeEach(async () => {
      component.showEditForm.set(true);
      await fixture.whenStable();
    });

    it('calls profileService.update with correct data', () => {
      component.submit();
      expect(profileService.update).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          companyName: 'Acme Corp',
          phone: '+237600000000',
          address: '123 Main St',
          interventionZone: 'Littoral',
          location: null,
        }),
      );
    });

    it('calls profileService.update with GeoJsonPoint when location is set', () => {
      component.form.controls.location.setValue({
        lat: 4.05,
        lng: 9.7,
        formattedAddress: 'Douala, Cameroon',
      });
      component.submit();
      expect(profileService.update).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          location: { type: 'Point', coordinates: [9.7, 4.05] },
        }),
      );
    });

    it('patches authService.currentUser on success', () => {
      const updatedProfile = makeProfile({ companyName: 'New Name' });
      profileService.update.mockReturnValue(of(updatedProfile));

      component.submit();

      const user = authService.currentUser();
      expect(user?.profile?.companyName).toBe('New Name');
    });

    it('shows success toast on success', () => {
      component.submit();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('hides form on success', () => {
      component.submit();
      expect(component.showEditForm()).toBe(false);
    });

    it('sets isSubmitting false on success', () => {
      component.submit();
      expect(component.isSubmitting()).toBe(false);
    });

    it('shows error toast on failure', () => {
      const errors: ApiError[] = [{ detail: 'Server error' } as ApiError];
      profileService.update.mockReturnValue(throwError(() => errors));

      component.submit();

      expect(toastService.error).toHaveBeenCalled();
    });

    it('calls applyApiErrors on failure with field errors', () => {
      const errors: ApiError[] = [
        { detail: 'Invalid phone', source: 'phone' } as ApiError,
      ];
      profileService.update.mockReturnValue(throwError(() => errors));

      component.submit();

      expect(component.form.controls.phone.hasError('apiError')).toBe(true);
      expect(component.form.controls.phone.getError('apiError')).toBe('Invalid phone');
    });

    it('sets isSubmitting false on failure', () => {
      profileService.update.mockReturnValue(throwError(() => []));
      component.submit();
      expect(component.isSubmitting()).toBe(false);
    });

    it('does nothing when profile id is missing', () => {
      authService.currentUser.set(makeUser(makeProfile({ id: undefined })));
      component.submit();
      expect(profileService.update).not.toHaveBeenCalled();
    });
  });
});
