import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '@strategis/auth/data-access';
import { Button, Input } from '@strategis/shared/ui';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Button, Input],
  templateUrl: './forgot-password.html',
  host: { class: 'flex flex-col min-w-sm' },
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly submitted = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  get email() {
    return this.form.controls.email;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.requestPasswordReset(this.email.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        // Always show success to avoid leaking whether email exists
        this.isLoading.set(false);
        this.submitted.set(true);
      },
    });
  }
}
