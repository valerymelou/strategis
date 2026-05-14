import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { Actor, ActorService } from '@strategis/profiles/data-access';
import { ToastService } from '@strategis/shared/ui';
import { AdminActorDetail } from './admin-actor-detail';

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return Object.assign(new Actor(), {
    id: 'actor-1',
    status: 'pending',
    reliabilityLevel: 'validated',
    complianceLevel: 'compliant',
    approvedForCategoryC: false,
    ...overrides,
  });
}

describe('AdminActorDetail', () => {
  let component: AdminActorDetail;
  let fixture: ComponentFixture<AdminActorDetail>;
  let actorService: {
    retrieve: jest.Mock;
    validate: jest.Mock;
    reject: jest.Mock;
    revoke: jest.Mock;
    setReliability: jest.Mock;
    setCompliance: jest.Mock;
    setCategoryC: jest.Mock;
  };
  let toastService: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    actorService = {
      retrieve: jest.fn().mockReturnValue(of(makeActor())),
      validate: jest.fn().mockReturnValue(of(undefined)),
      reject: jest.fn().mockReturnValue(of(undefined)),
      revoke: jest.fn().mockReturnValue(of(undefined)),
      setReliability: jest.fn().mockReturnValue(of(undefined)),
      setCompliance: jest.fn().mockReturnValue(of(undefined)),
      setCategoryC: jest.fn().mockReturnValue(of(undefined)),
    };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [AdminActorDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'actor-1' } } },
        },
        { provide: ActorService, useValue: actorService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminActorDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadActor()', () => {
    it('calls retrieve with route id on init', () => {
      expect(actorService.retrieve).toHaveBeenCalledWith('actor-1');
    });

    it('sets actor signal from response', () => {
      expect(component.actor()?.id).toBe('actor-1');
    });

    it('sets isLoading false after load', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('syncs reliabilityLevel control from actor', () => {
      actorService.retrieve.mockReturnValue(of(makeActor({ reliabilityLevel: 'certified' })));
      component.loadActor();
      expect(component.reliabilityLevel.value).toBe('certified');
    });

    it('syncs complianceLevel control from actor', () => {
      actorService.retrieve.mockReturnValue(of(makeActor({ complianceLevel: 'approved' })));
      component.loadActor();
      expect(component.complianceLevel.value).toBe('approved');
    });

    it('shows error toast and sets isLoading false on error', () => {
      actorService.retrieve.mockReturnValue(throwError(() => new Error('fail')));
      component.loadActor();
      expect(toastService.error).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('approve()', () => {
    it('calls actorService.validate', () => {
      component.approve();
      expect(actorService.validate).toHaveBeenCalledWith('actor-1');
    });

    it('shows success toast and reloads actor', () => {
      component.approve();
      expect(toastService.success).toHaveBeenCalled();
      expect(actorService.retrieve).toHaveBeenCalledTimes(2); // init + reload
    });

    it('shows error toast on failure and resets isSubmitting', () => {
      actorService.validate.mockReturnValue(throwError(() => new Error('fail')));
      component.approve();
      expect(toastService.error).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('confirmReject()', () => {
    it('does nothing when rejection reason is empty', () => {
      component.rejectionReason.setValue('');
      component.confirmReject();
      expect(actorService.reject).not.toHaveBeenCalled();
    });

    it('calls actorService.reject with trimmed reason', () => {
      component.rejectionReason.setValue('  fraud  ');
      component.confirmReject();
      expect(actorService.reject).toHaveBeenCalledWith('actor-1', 'fraud');
    });

    it('hides reject form and resets reason on success', () => {
      component.showRejectForm.set(true);
      component.rejectionReason.setValue('fraud');
      component.confirmReject();
      expect(component.showRejectForm()).toBe(false);
      expect(component.rejectionReason.value).toBeNull();
    });

    it('shows error toast on failure', () => {
      actorService.reject.mockReturnValue(throwError(() => new Error('fail')));
      component.rejectionReason.setValue('fraud');
      component.confirmReject();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('confirmRevoke()', () => {
    it('does nothing when revocation reason is empty', () => {
      component.revocationReason.setValue('');
      component.confirmRevoke();
      expect(actorService.revoke).not.toHaveBeenCalled();
    });

    it('calls actorService.revoke with trimmed reason', () => {
      component.revocationReason.setValue('  violation  ');
      component.confirmRevoke();
      expect(actorService.revoke).toHaveBeenCalledWith('actor-1', 'violation');
    });

    it('hides revoke form on success', () => {
      component.showRevokeForm.set(true);
      component.revocationReason.setValue('violation');
      component.confirmRevoke();
      expect(component.showRevokeForm()).toBe(false);
    });
  });

  describe('saveReliability()', () => {
    it('calls setReliability with current form value', () => {
      component.reliabilityLevel.setValue('certified');
      component.saveReliability();
      expect(actorService.setReliability).toHaveBeenCalledWith('actor-1', 'certified');
    });

    it('patches actor signal in place without reloading', () => {
      component.reliabilityLevel.setValue('declared');
      component.saveReliability();
      expect(actorService.retrieve).toHaveBeenCalledTimes(1); // only init, no reload
      expect(component.actor()?.reliabilityLevel).toBe('declared');
    });

    it('shows success toast', () => {
      component.reliabilityLevel.setValue('validated');
      component.saveReliability();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('shows error toast on failure', () => {
      actorService.setReliability.mockReturnValue(throwError(() => new Error('fail')));
      component.reliabilityLevel.setValue('validated');
      component.saveReliability();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('saveCompliance()', () => {
    it('calls setCompliance with current form value', () => {
      component.complianceLevel.setValue('approved');
      component.saveCompliance();
      expect(actorService.setCompliance).toHaveBeenCalledWith('actor-1', 'approved');
    });

    it('patches actor signal in place without reloading', () => {
      component.complianceLevel.setValue('at_risk');
      component.saveCompliance();
      expect(actorService.retrieve).toHaveBeenCalledTimes(1); // only init
      expect(component.actor()?.complianceLevel).toBe('at_risk');
    });
  });

  describe('toggleCategoryC()', () => {
    it('calls setCategoryC with approved=true', () => {
      component.toggleCategoryC(true);
      expect(actorService.setCategoryC).toHaveBeenCalledWith('actor-1', true);
    });

    it('patches actor approvedForCategoryC in place', () => {
      component.toggleCategoryC(true);
      expect(component.actor()?.approvedForCategoryC).toBe(true);
    });

    it('shows success toast with correct message for approval', () => {
      component.toggleCategoryC(true);
      expect(toastService.success).toHaveBeenCalled();
    });

    it('patches actor approvedForCategoryC to false when removing', () => {
      // Set it to true first
      actorService.retrieve.mockReturnValue(of(makeActor({ approvedForCategoryC: true })));
      component.loadActor();

      component.toggleCategoryC(false);
      expect(component.actor()?.approvedForCategoryC).toBe(false);
    });
  });

  describe('id getter', () => {
    it('returns id from route params', () => {
      expect(component.id).toBe('actor-1');
    });
  });
});
