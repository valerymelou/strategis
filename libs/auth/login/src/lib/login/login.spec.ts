import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jest.Mocked<Partial<AuthService>>;
  let router: Router;

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit when form is invalid', () => {
    component.submit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('calls authService.login with form values on valid submit', () => {
    component.form.setValue({ email: 'user@example.com', password: 'secret' });
    component.submit();

    expect(authService.login).toHaveBeenCalledWith(
      'user@example.com',
      'secret',
    );
  });

  it('navigates to / on successful login', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate');
    component.form.setValue({ email: 'user@example.com', password: 'secret' });
    component.submit();

    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('shows error message on failed login', async () => {
    (authService.login as jest.Mock).mockReturnValue(
      throwError(() => new Error('401')),
    );
    component.form.setValue({ email: 'user@example.com', password: 'wrong' });
    component.submit();

    await fixture.whenStable();
    expect(component.errorMessage()).not.toBeNull();
  });

  it('resets loading state after error', async () => {
    (authService.login as jest.Mock).mockReturnValue(
      throwError(() => new Error('401')),
    );
    component.form.setValue({ email: 'user@example.com', password: 'wrong' });
    component.submit();

    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
  });
});
