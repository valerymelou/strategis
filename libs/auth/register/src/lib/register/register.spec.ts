import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '@strategis/auth/data-access';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authService: jest.Mocked<Partial<AuthService>>;
  let router: Router;

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit when form is invalid', () => {
    component.submit();

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('calls authService.register with form values on valid submit', () => {
    component.form.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    component.submit();

    expect(authService.register).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    });
  });

  it('navigates to /auth/verify on successful registration', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    component.submit();

    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/verify']);
  });

  it('shows error message on failed registration', async () => {
    (authService.register as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'A user with that email already exists.' }]),
    );
    component.form.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    component.submit();

    await fixture.whenStable();
    expect(component.errorMessage()).toBe('A user with that email already exists.');
  });

  it('validates password mismatch', () => {
    component.form.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'different',
    });
    component.form.controls.confirmPassword.markAsTouched();

    expect(component.passwordsMismatch).toBe(true);
  });

  it('resets loading state after error', async () => {
    (authService.register as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'Server error.' }]),
    );
    component.form.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    component.submit();

    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
  });
});
