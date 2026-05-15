import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  AuthService,
  checkPasswordRules,
  passwordStrengthValidator,
} from '@strategis/auth/data-access';
import { applyApiErrors, parseJsonApiErrors } from '@strategis/common/http';
import { Button, Input } from '@strategis/shared/ui';
import { ApiError } from '@vmelou/jsonapi';

const passwordsMatch: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm
    ? { passwordsMismatch: true }
    : null;
};

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, Button, Input],
  templateUrl: './reset-password.html',
  host: { class: 'flex flex-col min-w-sm' },
})
export class ResetPassword {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly success = signal(false);

  private get token(): string {
    return this.route.snapshot.paramMap.get('token') ?? '';
  }

  readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordStrengthValidator],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch },
  );

  get password() {
    return this.form.controls.password;
  }
  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }
  get passwordsMismatch() {
    return (
      this.form.hasError('passwordsMismatch') && this.confirmPassword.touched
    );
  }
  get passwordRules() {
    return checkPasswordRules(this.password.value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.token) {
      this.errorMessage.set(
        $localize`:@@resetPassword.error.missingToken:Invalid or expired reset link.`,
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { password } = this.form.getRawValue();
    this.authService.confirmPasswordReset(this.token, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (errors: ApiError[]) => {
        this.isLoading.set(false);
        const { fieldErrors, nonFieldErrors } = parseJsonApiErrors(errors);
        applyApiErrors(this.form, fieldErrors);
        this.errorMessage.set(
          nonFieldErrors[0] ??
            $localize`:@@resetPassword.error.generic:Failed to reset password. The link may have expired.`,
        );
      },
    });
  }
}
