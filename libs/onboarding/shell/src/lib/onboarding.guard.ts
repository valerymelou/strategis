import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';

import { OnboardingService } from './onboarding.service';

/**
 * Loads onboarding state then redirects to first incomplete step.
 * Used on the /onboarding entry route.
 */
export const onboardingEntryGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/register']);
  }

  const load$ = onboarding.loaded() ? of(void 0) : onboarding.loadState();

  return load$.pipe(
    map(() => {
      if (!onboarding.hasProfile()) {
        return router.createUrlTree(['/onboarding/profile']);
      }
      if (!onboarding.hasActor()) {
        return router.createUrlTree(['/onboarding/role']);
      }
      return router.createUrlTree(['/']);
    }),
  );
};

/**
 * Allows access to /onboarding/profile for any authenticated user.
 * Ensures currentUser is loaded with profile includes so the form can prefill.
 */
export const profileStepGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/register']);
  }

  const load$ = onboarding.loaded() ? of(void 0) : onboarding.loadState();

  return load$.pipe(map(() => true));
};

/**
 * Allows access to /onboarding/plan only when profile exists.
 * If no profile, redirect to /onboarding/profile.
 */
export const planStepGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/register']);
  }

  const load$ = onboarding.loaded() ? of(void 0) : onboarding.loadState();

  return load$.pipe(
    map(() => {
      if (!onboarding.hasProfile()) {
        return router.createUrlTree(['/onboarding/profile']);
      }
      return true;
    }),
  );
};

/**
 * Ensures users have completed onboarding before accessing the main app.
 * Admins bypass this check — they never need a profile.
 * Non-admin users without a profile are redirected to /onboarding/profile.
 */
export const profileCompletionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Admins skip profile requirement
  if (auth.currentUser()?.isStaff) {
    return true;
  }

  const load$ = onboarding.loaded() ? of(void 0) : onboarding.loadState();

  return load$.pipe(
    map(() => {
      if (!onboarding.hasProfile()) {
        return router.createUrlTree(['/onboarding/profile']);
      }
      return true;
    }),
  );
};

/**
 * Allows access to /onboarding/role only when profile exists.
 * If actor already exists, redirect to /.
 * If no profile, redirect to /onboarding/profile.
 */
export const roleStepGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/register']);
  }

  const load$ = onboarding.loaded() ? of(void 0) : onboarding.loadState();

  return load$.pipe(
    map(() => {
      if (!onboarding.hasProfile()) {
        return router.createUrlTree(['/onboarding/profile']);
      }
      if (onboarding.hasActor()) {
        return router.createUrlTree(['/']);
      }
      return true;
    }),
  );
};
