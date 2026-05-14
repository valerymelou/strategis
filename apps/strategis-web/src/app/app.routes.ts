import { Route } from '@angular/router';

import { AuthLayout } from '@strategis/auth/layout';
import { Login } from '@strategis/auth/login';
import { Register } from '@strategis/auth/register';
import { EmailVerification } from '@strategis/auth/email-verification';
import { adminGuard, authGuard, loginGuard } from '@strategis/auth/data-access';
import { AdminActors, AdminActorDetail } from '@strategis/admin/actors';
import { AdminPremium, AdminPremiumDetail } from '@strategis/admin/premium';
import { Layout } from '@strategis/layout';
import {
  onboardingEntryGuard,
  profileStepGuard,
  planStepGuard,
  roleStepGuard,
} from '@strategis/onboarding/shell';
import { OnboardingProfile } from '@strategis/onboarding/profile';
import { OnboardingPlan } from '@strategis/onboarding/plan';
import { OnboardingRole } from '@strategis/onboarding/role';
import { themeResolver } from '@strategis/shared/theming';

export const appRoutes: Route[] = [
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    resolve: { theme: themeResolver },
    children: [
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'actors', pathMatch: 'full' },
          { path: 'actors', component: AdminActors },
          { path: 'actors/:id', component: AdminActorDetail },
          { path: 'premium', component: AdminPremium },
          { path: 'premium/:id', component: AdminPremiumDetail },
        ],
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login, canActivate: [loginGuard] },
      { path: 'register', component: Register, canActivate: [loginGuard] },
      { path: 'verify', component: EmailVerification },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'onboarding',
    component: AuthLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: OnboardingProfile,
        canActivate: [onboardingEntryGuard],
        pathMatch: 'full',
      },
      {
        path: 'profile',
        component: OnboardingProfile,
        canActivate: [profileStepGuard],
      },
      {
        path: 'plan',
        component: OnboardingPlan,
        canActivate: [planStepGuard],
      },
      {
        path: 'role',
        component: OnboardingRole,
        canActivate: [roleStepGuard],
      },
    ],
  },
];
