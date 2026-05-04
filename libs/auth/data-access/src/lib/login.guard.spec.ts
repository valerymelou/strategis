import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { loginGuard } from './login.guard';

describe('loginGuard', () => {
  let authService: AuthService;
  let router: Router;

  const runGuard = () =>
    TestBed.runInInjectionContext(() => loginGuard({} as never, {} as never));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('returns true when user is unauthenticated', () => {
    expect(runGuard()).toBe(true);
  });

  it('returns UrlTree to / when user is authenticated', () => {
    authService.currentUser.set({ id: '1', email: 'a@b.com', name: 'A' } as never);

    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
