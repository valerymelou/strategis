import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { PremiumUpgradeRequestService, ProfessionalProfile } from '@strategis/profiles/data-access';
import { OnboardingService } from '@strategis/onboarding/shell';
import { OnboardingPlan } from './onboarding-plan';

describe('OnboardingPlan', () => {
  let component: OnboardingPlan;
  let fixture: ComponentFixture<OnboardingPlan>;
  let upgradeService: jest.Mocked<Partial<PremiumUpgradeRequestService>>;
  let onboardingService: jest.Mocked<Partial<OnboardingService>>;
  let router: Router;

  const mockProfile = { id: '1' } as unknown as ProfessionalProfile;

  beforeEach(async () => {
    upgradeService = {
      requestUpgrade: jest.fn().mockReturnValue(of(undefined)),
    };

    onboardingService = {
      profile: signal(mockProfile) as unknown as OnboardingService['profile'],
    };

    await TestBed.configureTestingModule({
      imports: [OnboardingPlan],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: PremiumUpgradeRequestService, useValue: upgradeService },
        { provide: OnboardingService, useValue: onboardingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPlan);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to /onboarding/role when selecting free plan', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.selectFree();

    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/onboarding/role']);
  });

  it('calls requestUpgrade and navigates to /onboarding/role when selecting premium', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    jest.spyOn(window, 'open').mockImplementation(() => null);
    component.selectPremium();

    await fixture.whenStable();
    expect(upgradeService.requestUpgrade).toHaveBeenCalledWith('1');
    expect(navigateSpy).toHaveBeenCalledWith(['/onboarding/role']);
  });

  it('still navigates on premium upgrade error', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    jest.spyOn(window, 'open').mockImplementation(() => null);
    (upgradeService.requestUpgrade as jest.Mock).mockReturnValue(
      throwError(() => new Error('500')),
    );
    component.selectPremium();

    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/onboarding/role']);
  });
});
