import { Injectable, computed, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { Actor, ProfessionalProfile } from '@strategis/profiles/data-access';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly authService = inject(AuthService);

  /**
   * True once getMe() has completed (set by AuthService.loadCurrentUser).
   * Guards skip reloading when already true to prevent redundant API calls.
   */
  readonly loaded = computed(() => this.authService.userLoaded());

  readonly profile = computed<ProfessionalProfile | null>(
    () => this.authService.currentUser()?.profile ?? null,
  );

  readonly actors = computed<Actor[]>(() => this.profile()?.actors ?? []);

  /**
   * Fetches /users/me with profile+actors includes and marks state as loaded.
   * Called by guards when loaded() is false (e.g. after in-app login).
   */
  loadState(): Observable<void> {
    return this.authService.loadCurrentUser().pipe(map(() => void 0));
  }

  hasProfile(): boolean {
    return this.profile() !== null;
  }

  hasActor(): boolean {
    return this.actors().length > 0;
  }
}
