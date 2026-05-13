import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { OnboardingService } from '@strategis/onboarding/shell';
import {
  ActorService,
  ActorType,
  ActorTypeService,
  ProfessionalProfile,
} from '@strategis/profiles/data-access';
import { parseJsonApiErrors } from '@strategis/common/http';
import { Badge, Button } from '@strategis/shared/ui';
import { ApiError } from '@vmelou/jsonapi';
import { User } from '@strategis/users/data-access';

@Component({
  selector: 'app-onboarding-role',
  imports: [Badge, Button],
  templateUrl: './onboarding-role.html',
  host: { class: 'flex flex-col min-w-sm' },
})
export class OnboardingRole implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly actorTypeService = inject(ActorTypeService);
  private readonly actorService = inject(ActorService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly actorTypes = signal<ActorType[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly isLoading = signal(false);
  readonly isLoadingTypes = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.isLoadingTypes.set(true);
    this.actorTypeService.list().subscribe({
      next: (result) => {
        this.actorTypes.set(result.data ?? []);
        this.isLoadingTypes.set(false);
      },
      error: () => {
        this.isLoadingTypes.set(false);
        this.errorMessage.set(
          $localize`:@@onboardingRole.error.loadTypes:Failed to load roles. Please refresh.`,
        );
      },
    });
  }

  toggle(actorType: ActorType): void {
    const id = actorType.id;
    if (!id) return;
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  isSelected(actorType: ActorType): boolean {
    return !!actorType.id && this.selectedIds().has(actorType.id);
  }

  submit(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin(
      ids.map((id) => this.actorService.create({ actorType: new ActorType({ id }) })),
    ).subscribe({
      next: (actors) => {
        const user = this.authService.currentUser();
        if (user?.profile) {
          const profile = new ProfessionalProfile({ ...user.profile, actors });
          this.authService.currentUser.set(new User({ ...user, profile }));
        }
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (errors: ApiError[]) => {
        this.isLoading.set(false);
        const { nonFieldErrors } = parseJsonApiErrors(errors);
        this.errorMessage.set(nonFieldErrors[0] ?? null);
      },
    });
  }
}
