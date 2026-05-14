import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { Actor, ActorService, ProfessionalProfile } from '@strategis/profiles/data-access';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly authService = inject(AuthService);
  private readonly actorService = inject(ActorService);

  readonly loaded = computed(() => this.authService.userLoaded());

  readonly profile = computed<ProfessionalProfile | null>(
    () => this.authService.currentUser()?.profile ?? null,
  );

  private readonly actorsSignal = signal<Actor[]>([]);
  readonly actors = computed<Actor[]>(() => this.actorsSignal());

  loadState(): Observable<void> {
    return forkJoin([
      this.authService.loadCurrentUser(),
      this.actorService.list().pipe(catchError(() => of(null))),
    ]).pipe(
      tap(([, result]) => { if (result) this.actorsSignal.set(result.data); }),
      map(() => void 0),
    );
  }

  hasProfile(): boolean {
    return this.profile() !== null;
  }

  hasActor(): boolean {
    return this.actors().length > 0;
  }
}
