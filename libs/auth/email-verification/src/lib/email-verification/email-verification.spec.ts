import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { AuthService } from '@strategis/auth/data-access';
import { EmailVerification } from './email-verification';

describe('EmailVerification', () => {
  let component: EmailVerification;
  let fixture: ComponentFixture<EmailVerification>;
  let authService: jest.Mocked<Partial<AuthService>>;
  let router: Router;

  beforeEach(async () => {
    authService = {
      verifyEmail: jest.fn().mockReturnValue(of(undefined)),
      resendVerification: jest.fn().mockReturnValue(of(undefined)),
      currentUser: signal(null) as unknown as AuthService['currentUser'],
    };

    await TestBed.configureTestingModule({
      imports: [EmailVerification],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerification);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit when code is invalid', () => {
    component.code.setValue('');
    component.submit();

    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });

  it('calls authService.verifyEmail with the code on valid submit', () => {
    component.code.setValue('123456');
    component.submit();

    expect(authService.verifyEmail).toHaveBeenCalledWith('123456');
  });

  it('navigates to /onboarding/profile on success', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.code.setValue('123456');
    component.submit();

    await fixture.whenStable();
    expect(navigateSpy).toHaveBeenCalledWith(['/onboarding/profile']);
  });

  it('shows error message on failed verification', async () => {
    (authService.verifyEmail as jest.Mock).mockReturnValue(
      throwError(() => [{ detail: 'Invalid verification code.' }]),
    );
    component.code.setValue('000000');
    component.submit();

    await fixture.whenStable();
    expect(component.errorMessage()).not.toBeNull();
  });

  it('starts with a 60s resend countdown', () => {
    expect(component.resendCountdown()).toBe(60);
    expect(component.canResend()).toBe(false);
  });

  it('canResend is false when countdown > 0', () => {
    component.resendCountdown.set(10);
    expect(component.canResend()).toBe(false);
  });

  it('canResend is true when countdown reaches 0', () => {
    component.resendCountdown.set(0);
    expect(component.canResend()).toBe(true);
  });

  it('does not call resendVerification when canResend is false', () => {
    component.resendCountdown.set(30);
    component.resend();
    expect(authService.resendVerification).not.toHaveBeenCalled();
  });

  it('calls resendVerification when canResend is true', async () => {
    component.resendCountdown.set(0);
    component.resend();
    await fixture.whenStable();
    expect(authService.resendVerification).toHaveBeenCalled();
  });
});
