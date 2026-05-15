import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { Actor, ActorService, ActorType, ActorTypeService } from '@strategis/profiles/data-access';
import { ToastService } from '@strategis/shared/ui';
import { MyRoles } from './my-roles';

function makeActorType(overrides: Partial<ActorType> = {}): ActorType {
  return Object.assign(new ActorType(), {
    id: 'type-1',
    name: 'Shipper',
    slug: 'shipper',
    description: 'Ships goods',
    requiresValidation: false,
    ...overrides,
  });
}

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return Object.assign(new Actor(), {
    id: 'actor-1',
    actorType: makeActorType({ id: 'type-1' }),
    status: 'pending',
    isAvailable: false,
    ...overrides,
  });
}

describe('MyRoles', () => {
  let component: MyRoles;
  let fixture: ComponentFixture<MyRoles>;
  let actorTypeService: { list: jest.Mock };
  let actorService: { listOwn: jest.Mock; create: jest.Mock };
  let toastService: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    actorTypeService = {
      list: jest.fn().mockReturnValue(of({ data: [makeActorType()] })),
    };

    actorService = {
      listOwn: jest.fn().mockReturnValue(of({ data: [] })),
      create: jest.fn().mockReturnValue(of(makeActor())),
    };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [MyRoles],
      providers: [
        provideRouter([]),
        { provide: ActorTypeService, useValue: actorTypeService },
        { provide: ActorService, useValue: actorService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyRoles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads actor types and actors on init using forkJoin', () => {
    expect(actorTypeService.list).toHaveBeenCalled();
    expect(actorService.listOwn).toHaveBeenCalled();
  });

  it('sets isLoading false after load', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('sets actorTypes from response', () => {
    expect(component.actorTypes()).toHaveLength(1);
    expect(component.actorTypes()[0].id).toBe('type-1');
  });

  it('sets actors from response', () => {
    actorService.listOwn.mockReturnValue(of({ data: [makeActor()] }));
    actorTypeService.list.mockReturnValue(of({ data: [makeActorType()] }));
    component.ngOnInit();
    expect(component.actors()).toHaveLength(1);
  });

  it('sets isLoading false on error', () => {
    actorTypeService.list.mockReturnValue(throwError(() => new Error('fail')));
    component.isLoading.set(true);
    component.ngOnInit();
    expect(component.isLoading()).toBe(false);
  });

  it('shows error toast on load failure', () => {
    actorTypeService.list.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(toastService.error).toHaveBeenCalled();
  });

  describe('actorsNeedingDocuments()', () => {
    it('returns actors with awaiting_documents status', () => {
      component.actors.set([
        makeActor({ id: 'a1', status: 'active' }),
        makeActor({ id: 'a2', status: 'awaiting_documents' }),
        makeActor({ id: 'a3', status: 'pending' }),
      ]);
      expect(component.actorsNeedingDocuments()).toHaveLength(1);
      expect(component.actorsNeedingDocuments()[0].id).toBe('a2');
    });

    it('returns empty array when no actors need documents', () => {
      component.actors.set([makeActor({ status: 'active' })]);
      expect(component.actorsNeedingDocuments()).toHaveLength(0);
    });
  });

  describe('isOwned()', () => {
    it('returns true for existing actor types', () => {
      actorService.listOwn.mockReturnValue(of({ data: [makeActor({ actorType: makeActorType({ id: 'type-1' }) })] }));
      actorTypeService.list.mockReturnValue(of({ data: [makeActorType()] }));
      component.ngOnInit();
      expect(component.isOwned('type-1')).toBe(true);
    });

    it('returns false for new actor types', () => {
      expect(component.isOwned('type-99')).toBe(false);
    });
  });

  describe('toggle()', () => {
    it('adds to selectedIds when not selected', () => {
      component.toggle('type-1');
      expect(component.isSelected('type-1')).toBe(true);
    });

    it('removes from selectedIds when already selected', () => {
      component.toggle('type-1');
      component.toggle('type-1');
      expect(component.isSelected('type-1')).toBe(false);
    });

    it('does nothing for owned actor type', () => {
      actorService.listOwn.mockReturnValue(of({ data: [makeActor({ actorType: makeActorType({ id: 'type-1' }) })] }));
      actorTypeService.list.mockReturnValue(of({ data: [makeActorType()] }));
      component.ngOnInit();
      component.toggle('type-1');
      expect(component.isSelected('type-1')).toBe(false);
    });
  });

  describe('addRoles()', () => {
    it('calls create for each selected id', () => {
      component.selectedIds.set(new Set(['type-1', 'type-2']));
      actorService.create.mockReturnValue(of(makeActor()));
      component.addRoles();
      expect(actorService.create).toHaveBeenCalledTimes(2);
    });

    it('appends actors to signal on success', () => {
      const existingActor = makeActor({ id: 'existing', actorType: makeActorType({ id: 'type-0' }) });
      component.actors.set([existingActor]);
      component.selectedIds.set(new Set(['type-1']));

      const newActor = makeActor({ id: 'new-actor', actorType: makeActorType({ id: 'type-1' }) });
      actorService.create.mockReturnValue(of(newActor));

      component.addRoles();
      expect(component.actors()).toHaveLength(2);
      expect(component.actors()[1].id).toBe('new-actor');
    });

    it('clears selectedIds on success', () => {
      component.selectedIds.set(new Set(['type-1']));
      actorService.create.mockReturnValue(of(makeActor()));
      component.addRoles();
      expect(component.selectedIds().size).toBe(0);
    });

    it('shows success toast on success', () => {
      component.selectedIds.set(new Set(['type-1']));
      actorService.create.mockReturnValue(of(makeActor()));
      component.addRoles();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('shows error toast on failure', () => {
      component.selectedIds.set(new Set(['type-1']));
      actorService.create.mockReturnValue(throwError(() => new Error('fail')));
      component.addRoles();
      expect(toastService.error).toHaveBeenCalled();
    });
  });
});
