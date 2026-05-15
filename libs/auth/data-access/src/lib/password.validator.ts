import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordRules {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
}

export function checkPasswordRules(value: string): PasswordRules {
  return {
    minLength: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    digit: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

export const passwordStrengthValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value: string = control.value ?? '';
  if (!value) return null; // required validator handles empty

  const rules = checkPasswordRules(value);
  const failing = (Object.keys(rules) as (keyof PasswordRules)[]).filter(
    (k) => !rules[k],
  );
  return failing.length > 0 ? { passwordStrength: failing } : null;
};
