import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { PremiumUpgradeRequestService } from '@strategis/profiles/data-access';
import { AuthService } from '@strategis/auth/data-access';
import { ToastService } from '@strategis/shared/ui';
import { MySubscription } from './my-subscription';

const mockResult = (data: unknown[] = []) =>
  ({ data, meta: { pagination: { count: data.length, page: 1, pages: 1 } } } as ReturnType<
    PremiumUpgradeRequestService['listAll']
  > extends import('rxjs').Observable<infer T>
    ? T
    : never);

const mockUser = {
  profile: { id: 'profile-1', tier: 'FREE' },
} as unknown as import('@strategis/users/data-access').User;

describe('MySubscription', () => {
  let component: MySubscription;
  let fixture: ComponentFixture<MySubscription>;
  let premiumService: { listAll: jest.Mock; requestUpgrade: jest.Mock };
  let authService: { currentUser: ReturnType<typeof signal> };
  let toastService: { success: jest.Mock; error: jest.Mock; info: jest.Mock };

  beforeEach(async () => {
    premiumService = {
      listAll: jest.fn().mockReturnValue(of(mockResult())),
      requestUpgrade: jest.fn().mockReturnValue(of({})),
    };

    authService = {
      currentUser: signal(mockUser),
    };

    toastService = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MySubscription],
      providers: [
        provideRouter([]),
        { provide: PremiumUpgradeRequestService, useValue: premiumService },
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MySubscription);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls listAll on init', () => {
    expect(premiumService.listAll).toHaveBeenCalled();
  });

  it('sets isLoading false after load', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('sets requests sorted by created desc', () => {
    const requests = [
      { id: 'r1', created: '2024-01-01', status: 'pending' },
      { id: 'r2', created: '2024-03-01', status: 'activated' },
      { id: 'r3', created: '2024-02-01', status: 'expired' },
    ];
    premiumService.listAll.mockReturnValue(of(mockResult(requests)));

    component.load();

    const stored = component.requests();
    expect(stored[0].id).toBe('r2');
    expect(stored[1].id).toBe('r3');
    expect(stored[2].id).toBe('r1');
  });

  it('sets isLoading false on error and shows error toast', () => {
    premiumService.listAll.mockReturnValue(throwError(() => new Error('network')));

    component.load();

    expect(component.isLoading()).toBe(false);
    expect(toastService.error).toHaveBeenCalled();
  });

  it('hasPendingRequest returns true when pending exists', () => {
    const requests = [{ id: 'r1', created: '2024-01-01', status: 'pending' }];
    premiumService.listAll.mockReturnValue(of(mockResult(requests)));

    component.load();

    expect(component.hasPendingRequest()).toBe(true);
  });

  it('requestUpgrade calls service with profile id', () => {
    component.requestUpgrade();

    expect(premiumService.requestUpgrade).toHaveBeenCalledWith('profile-1');
  });

  it('requestUpgrade shows success toast and reloads', () => {
    premiumService.requestUpgrade.mockReturnValue(of({}));

    component.requestUpgrade();

    expect(toastService.success).toHaveBeenCalled();
    expect(premiumService.listAll).toHaveBeenCalledTimes(2); // once on init, once after upgrade
  });

  it('requestUpgrade shows error toast on failure', () => {
    premiumService.requestUpgrade.mockReturnValue(throwError(() => new Error('fail')));

    component.requestUpgrade();

    expect(toastService.error).toHaveBeenCalled();
  });

  it('requestUpgrade does nothing when no profile', () => {
    authService.currentUser.set({ profile: null } as unknown as import('@strategis/users/data-access').User);
    premiumService.requestUpgrade.mockClear();

    component.requestUpgrade();

    expect(premiumService.requestUpgrade).not.toHaveBeenCalled();
  });
});
