import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { CreateMixin } from '@vmelou/jsonapi-angular';

import { User, UserService } from '@strategis/users/data-access';
import { Register } from './register';

interface JsonApiResponse<T> {
  data: {
    id: string;
    type: string;
    attributes: Omit<T, 'id'>;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  /** True once currentUser has been fetched from /users/me (with profile includes). */
  readonly userLoaded = signal(false);
  readonly isEmailVerified = computed(
    () => this.currentUser()?.isEmailVerified ?? false,
  );

  private readonly registerMixin = new CreateMixin<Register>(
    this.http,
    '/auth/register',
    Register,
  );

  register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Observable<void> {
    return this.registerMixin
      .create(data)
      .pipe(
        tap((result) => this.currentUser.set(Object.assign(new User(), result))),
        map(() => void 0),
      );
  }

  verifyEmail(code: string): Observable<void> {
    return this.http
      .post<void>('/auth/verify-email/', {
        data: { type: 'EmailVerification', attributes: { code } },
      })
      .pipe(map(() => void 0));
  }

  resendVerification(): Observable<void> {
    return this.http
      .post<void>('/auth/resend-verification/', {})
      .pipe(map(() => void 0));
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<JsonApiResponse<User>>('/auth/login/', {
        data: { type: 'Login', attributes: { email, password } },
      })
      .pipe(
        tap((response) => this.currentUser.set(this._mapUser(response))),
        map(() => void 0),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/auth/logout/', {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
      }),
      map(() => void 0),
      catchError(() => {
        // Even if the server call fails, clear client state
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
        return of(void 0);
      }),
    );
  }

  refreshToken(): Observable<void> {
    return this.http.post<void>('/auth/refresh/', {}).pipe(map(() => void 0));
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http
      .post<void>('/auth/password-reset/', {
        data: { type: 'PasswordResetRequest', attributes: { email } },
      })
      .pipe(map(() => void 0));
  }

  confirmPasswordReset(token: string, password: string): Observable<void> {
    return this.http
      .post<void>('/auth/password-reset/confirm/', {
        data: { type: 'PasswordResetConfirm', attributes: { token, password } },
      })
      .pipe(map(() => void 0));
  }

  loadCurrentUser(): Observable<User | null> {
    return this.userService.getMe().pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.userLoaded.set(true);
      }),
      catchError(() => {
        this.currentUser.set(null);
        this.userLoaded.set(true);
        return of(null);
      }),
    );
  }

  initializeAuth(): Promise<void> {
    return firstValueFrom(
      this.loadCurrentUser().pipe(
        map(() => void 0),
        catchError(() => of(void 0)),
      ),
    );
  }

  private _mapUser(response: JsonApiResponse<User>): User {
    const attrs = response.data.attributes as Record<string, unknown>;
    return new User({
      id: response.data.id,
      email: attrs['email'] as string,
      firstName: attrs['firstName'] as string,
      lastName: attrs['lastName'] as string,
    });
  }
}
