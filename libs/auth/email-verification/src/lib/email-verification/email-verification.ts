import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '@strategis/auth/data-access';
import { applyApiErrors, parseJsonApiErrors } from '@strategis/common/http';
import { Button, OtpInput } from '@strategis/shared/ui';
import { ApiError } from '@vmelou/jsonapi';

@Component({
  selector: 'app-email-verification',
  imports: [ReactiveFormsModule, Button, OtpInput],
  templateUrl: './email-verification.html',
  host: { class: 'flex flex-col min-w-sm' },
})
export class EmailVerification implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly isResending = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly resendCountdown = signal(0);
  readonly canResend = computed(
    () => this.resendCountdown() === 0 && !this.isResending(),
  );

  readonly maskedEmail = computed(() => {
    const email = this.authService.currentUser()?.email ?? '';
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
  });

  readonly code = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
    ],
  });
  form = new FormGroup({ code: this.code });

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startCountdown(60);
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private startCountdown(seconds: number): void {
    this.clearCountdown();
    this.resendCountdown.set(seconds);
    this.countdownInterval = setInterval(() => {
      const current = this.resendCountdown();
      if (current <= 1) {
        this.resendCountdown.set(0);
        this.clearCountdown();
      } else {
        this.resendCountdown.set(current - 1);
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  submit(): void {
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyEmail(this.code.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/onboarding/profile']);
      },
      error: (errors: ApiError[]) => {
        this.isLoading.set(false);
        const { fieldErrors, nonFieldErrors } = parseJsonApiErrors(errors);
        applyApiErrors(this.form, fieldErrors);
        this.errorMessage.set(
          nonFieldErrors[0] ??
            $localize`:@@emailVerification.error.invalid:Invalid or expired code. Please try again.`,
        );
      },
    });
  }

  resend(): void {
    if (!this.canResend()) return;

    this.isResending.set(true);
    this.errorMessage.set(null);

    this.authService.resendVerification().subscribe({
      next: () => {
        this.isResending.set(false);
        this.startCountdown(60);
      },
      error: (errors: ApiError[]) => {
        this.isResending.set(false);
        const { nonFieldErrors } = parseJsonApiErrors(errors);
        this.errorMessage.set(
          nonFieldErrors[0] ??
            $localize`:@@emailVerification.error.resend:Failed to resend code. Please try again.`,
        );
      },
    });
  }
}
