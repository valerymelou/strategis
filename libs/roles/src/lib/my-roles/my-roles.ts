import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideUpload,
  lucideAlertTriangle,
  lucideCheck,
} from '@ng-icons/lucide';

import {
  Actor,
  ActorService,
  ActorType,
  ActorTypeService,
} from '@strategis/profiles/data-access';
import { Badge, Button, ToastService } from '@strategis/shared/ui';

@Component({
  selector: 'lib-my-roles',
  imports: [RouterLink, Badge, NgIconComponent, Button],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideUpload,
      lucideAlertTriangle,
      lucideCheck,
    }),
  ],
  templateUrl: './my-roles.html',
})
export class MyRoles implements OnInit {
  private readonly actorTypeService = inject(ActorTypeService);
  private readonly actorService = inject(ActorService);
  private readonly toast = inject(ToastService);

  readonly actorTypes = signal<ActorType[]>([]);
  readonly actors = signal<Actor[]>([]);
  readonly isLoading = signal(true);
  readonly isAdding = signal(false);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly existingActorTypeIds = computed(
    () =>
      new Set(
        this.actors()
          .map((a) => a.actorType?.id)
          .filter((id): id is string => !!id),
      ),
  );

  readonly actorByTypeId = computed(() => {
    const map = new Map<string, Actor>();
    this.actors().forEach((a) => {
      if (a.actorType?.id) map.set(a.actorType.id, a);
    });
    return map;
  });

  readonly actorsNeedingDocuments = computed(() =>
    this.actors().filter((a) => a.status === 'awaiting_documents'),
  );

  ngOnInit(): void {
    forkJoin({
      types: this.actorTypeService.list(),
      actors: this.actorService.listOwn(),
    }).subscribe({
      next: ({ types, actors }) => {
        this.actorTypes.set(types.data ?? []);
        this.actors.set(actors.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error(
          $localize`:@@roles.error.loadFailed:Failed to load roles.`,
        );
        this.isLoading.set(false);
      },
    });
  }

  toggle(actorTypeId: string): void {
    if (this.isOwned(actorTypeId)) return;
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(actorTypeId)) {
        next.delete(actorTypeId);
      } else {
        next.add(actorTypeId);
      }
      return next;
    });
  }

  isOwned(actorTypeId: string): boolean {
    return this.existingActorTypeIds().has(actorTypeId);
  }

  isSelected(actorTypeId: string): boolean {
    return this.selectedIds().has(actorTypeId);
  }

  addRoles(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    this.isAdding.set(true);
    forkJoin(
      ids.map((id) =>
        this.actorService.create({ actorType: new ActorType({ id }) }),
      ),
    ).subscribe({
      next: (newActors) => {
        this.actors.update((existing) => [...existing, ...newActors]);
        this.selectedIds.set(new Set());
        this.isAdding.set(false);
        this.toast.success(
          $localize`:@@roles.success.rolesAdded:Roles added successfully.`,
        );
      },
      error: () => {
        this.toast.error(
          $localize`:@@roles.error.addFailed:Failed to add roles.`,
        );
        this.isAdding.set(false);
      },
    });
  }
}
