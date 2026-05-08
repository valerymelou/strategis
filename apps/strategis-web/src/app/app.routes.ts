import { Route } from '@angular/router';

import { AuthLayout } from '@strategis/auth/layout';
import { Login } from '@strategis/auth/login';
import { Register } from '@strategis/auth/register';
import { authGuard, loginGuard } from '@strategis/auth/data-access';
import { Layout } from '@strategis/layout';
import { themeResolver } from '@strategis/shared/theming';

export const appRoutes: Route[] = [
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    resolve: { theme: themeResolver },
    children: [],
  },
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [loginGuard],
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
