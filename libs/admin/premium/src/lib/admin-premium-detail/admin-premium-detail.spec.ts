import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { PremiumUpgradeRequest, PremiumUpgradeRequestService } from '@strategis/profiles/data-access';
import { ToastService } from '@strategis/shared/ui';
import { AdminPremiumDetail } from './admin-premium-detail';

function makeRequest(overrides: Partial<PremiumUpgradeRequest> = {}): PremiumUpgradeRequest {
  return Object.assign(new PremiumUpgradeRequest(), {
    id: 'req-1',
    status: 'pending',
    plan: null,
    ...overrides,
  });
}

describe('AdminPremiumDetail', () => {
  let component: AdminPremiumDetail;
  let fixture: ComponentFixture<AdminPremiumDetail>;
  let premiumService: {
    retrieve: jest.Mock;
    activate: jest.Mock;
    reject: jest.Mock;
  };
  let toastService: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    premiumService = {
      retrieve: jest.fn().mockReturnValue(of(makeRequest())),
      activate: jest.fn().mockReturnValue(of(undefined)),
      reject: jest.fn().mockReturnValue(of(undefined)),
    };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [AdminPremiumDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'req-1' } } },
        },
        { provide: PremiumUpgradeRequestService, useValue: premiumService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPremiumDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadRequest()', () => {
    it('calls retrieve with route id on init', () => {
      expect(premiumService.retrieve).toHaveBeenCalledWith('req-1');
    });

    it('sets request signal from response', () => {
      expect(component.request()?.id).toBe('req-1');
    });

    it('sets isLoading false after load', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('shows error toast and sets isLoading false on error', () => {
      premiumService.retrieve.mockReturnValue(throwError(() => new Error('fail')));
      component.loadRequest();
      expect(toastService.error).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('activate()', () => {
    it('calls activate with id and selected plan', () => {
      component.plan.setValue('monthly');
      component.activate();
      expect(premiumService.activate).toHaveBeenCalledWith('req-1', 'monthly');
    });

    it('calls activate with annual plan when selected', () => {
      component.plan.setValue('annual');
      component.activate();
      expect(premiumService.activate).toHaveBeenCalledWith('req-1', 'annual');
    });

    it('shows success toast and reloads request', () => {
      component.plan.setValue('monthly');
      component.activate();
      expect(toastService.success).toHaveBeenCalled();
      expect(premiumService.retrieve).toHaveBeenCalledTimes(2); // init + reload
    });

    it('shows error toast on failure and resets isSubmitting', () => {
      premiumService.activate.mockReturnValue(throwError(() => new Error('fail')));
      component.plan.setValue('monthly');
      component.activate();
      expect(toastService.error).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('does nothing when plan is null', () => {
      component.plan.setValue(null);
      component.activate();
      expect(premiumService.activate).not.toHaveBeenCalled();
    });
  });

  describe('confirmReject()', () => {
    it('does nothing when rejection reason is empty', () => {
      component.rejectionReason.setValue('');
      component.confirmReject();
      expect(premiumService.reject).not.toHaveBeenCalled();
    });

    it('calls reject with trimmed reason', () => {
      component.rejectionReason.setValue('  duplicate request  ');
      component.confirmReject();
      expect(premiumService.reject).toHaveBeenCalledWith('req-1', 'duplicate request');
    });

    it('hides reject form and resets reason on success', () => {
      component.showRejectForm.set(true);
      component.rejectionReason.setValue('fraud');
      component.confirmReject();
      expect(component.showRejectForm()).toBe(false);
      expect(component.rejectionReason.value).toBeNull();
    });

    it('shows success toast on success', () => {
      component.rejectionReason.setValue('fraud');
      component.confirmReject();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('shows error toast on failure', () => {
      premiumService.reject.mockReturnValue(throwError(() => new Error('fail')));
      component.rejectionReason.setValue('fraud');
      component.confirmReject();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('id getter', () => {
    it('returns id from route params', () => {
      expect(component.id).toBe('req-1');
    });
  });
});
