import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@strategis/auth/data-access';
import { Button } from '@strategis/shared/ui';
import { Input } from '@strategis/shared/ui';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Button, Input],
  templateUrl: './login.html',
  host: {
    class: 'flex flex-col min-w-sm',
  },
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(
          $localize`:@@login.error.invalidCredentials:Invalid email or password.`,
        );
      },
    });
  }
}
