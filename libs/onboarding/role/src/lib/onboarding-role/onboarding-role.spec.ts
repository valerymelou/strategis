import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { OnboardingService } from '@strategis/onboarding/shell';
import {
  Actor,
  ActorService,
  ActorType,
  ActorTypeService,
} from '@strategis/profiles/data-access';
import { User } from '@strategis/users/data-access';
import { OnboardingRole } from './onboarding-role';

const ACTOR_TYPES: ActorType[] = [
  Object.assign(new ActorType(), {
    id: 'at1',
    name: 'Producer',
    description: 'Produces waste',
    requiresValidation: false,
  }),
  Object.assign(new ActorType(), {
    id: 'at2',
    name: 'Recycler',
    description: 'Recycles waste',
    requiresValidation: true,
  }),
];

const MOCK_ACTOR = Object.assign(new Actor(), { id: 'actor-1' });

describe('OnboardingRole', () => {
  let component: OnboardingRole;
  let fixture: ComponentFixture<OnboardingRole>;
  let actorTypeService: jest.Mocked<Partial<ActorTypeService>>;
  let actorService: jest.Mocked<Partial<ActorService>>;
  let router: Router;

  beforeEach(async () => {
    actorTypeService = {
      list: jest.fn().mockReturnValue(of({ data: ACTOR_TYPES })),
    };
    actorService = {
      create: jest.fn().mockReturnValue(of(MOCK_ACTOR)),
    };

    await TestBed.configureTestingModule({
      imports: [OnboardingRole],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: ActorTypeService, useValue: actorTypeService },
        { provide: ActorService, useValue: actorService },
        {
          provide: OnboardingService,
          useValue: {
            profile: signal(null),
            actors: signal([]),
            hasProfile: () => false,
            hasActor: () => false,
          },
        },
        { provide: AuthService, useValue: { currentUser: signal<User | null>(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingRole);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('loads actor types on init', () => {
    expect(actorTypeService.list).toHaveBeenCalled();
    expect(component.actorTypes()).toHaveLength(2);
  });

  it('does not submit when nothing is selected', () => {
    component.submit();
    expect(actorService.create).not.toHaveBeenCalled();
  });

  it('toggle selects an actor type', () => {
    component.toggle(ACTOR_TYPES[0]);
    expect(component.isSelected(ACTOR_TYPES[0])).toBe(true);
  });

  it('toggle deselects an already-selected actor type', () => {
    component.toggle(ACTOR_TYPES[0]);
    component.toggle(ACTOR_TYPES[0]);
    expect(component.isSelected(ACTOR_TYPES[0])).toBe(false);
  });

  it('allows selecting multiple actor types simultaneously', () => {
    component.toggle(ACTOR_TYPES[0]);
    component.toggle(ACTOR_TYPES[1]);
    expect(component.isSelected(ACTOR_TYPES[0])).toBe(true);
    expect(component.isSelected(ACTOR_TYPES[1])).toBe(true);
    expect(component.selectedIds().size).toBe(2);
  });

  it('calls actorService.create for each selected type on submit', () => {
    component.toggle(ACTOR_TYPES[0]);
    component.toggle(ACTOR_TYPES[1]);
    component.submit();

    expect(actorService.create).toHaveBeenCalledTimes(2);
    expect(actorService.create).toHaveBeenCalledWith(
      expect.objectContaining({ actorType: expect.objectContaining({ id: 'at1' }) }),
    );
    expect(actorService.create).toHaveBeenCalledWith(
      expect.objectContaining({ actorType: expect.objectContaining({ id: 'at2' }) }),
    );
  });

  it('navigates to / after all actors are created', async () => {
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.toggle(ACTOR_TYPES[0]);
    component.submit();
    await fixture.whenStable();
    expect(spy).toHaveBeenCalledWith(['/']);
  });

  it('shows error message when actor creation fails', async () => {
    (actorService.create as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'Actor type not available.' }]),
    );
    component.toggle(ACTOR_TYPES[0]);
    component.submit();
    await fixture.whenStable();
    expect(component.errorMessage()).toBe('Actor type not available.');
  });

  it('resets loading state after error', async () => {
    (actorService.create as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'Error.' }]),
    );
    component.toggle(ACTOR_TYPES[0]);
    component.submit();
    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
  });
});
