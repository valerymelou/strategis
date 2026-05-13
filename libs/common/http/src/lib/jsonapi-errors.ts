import { FormGroup } from '@angular/forms';
import { ApiError } from '@vmelou/jsonapi';

export interface JsonApiParsedErrors {
  fieldErrors: Record<string, string[]>;
  nonFieldErrors: string[];
}

export function parseJsonApiErrors(errors: ApiError[]): JsonApiParsedErrors {
  const fieldErrors: Record<string, string[]> = {};
  const nonFieldErrors: string[] = [];

  for (const e of errors) {
    const detail = e.detail ?? 'Unknown error.';
    if (e.source) {
      (fieldErrors[e.source] ??= []).push(detail);
    } else {
      nonFieldErrors.push(detail);
    }
  }

  if (errors.length === 0) {
    nonFieldErrors.push('Something went wrong. Please try again.');
  }

  return { fieldErrors, nonFieldErrors };
}

export function applyApiErrors(
  form: FormGroup,
  fieldErrors: Record<string, string[]>,
): void {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ ...control.errors, apiError: messages[0] });
      control.markAsTouched();
    }
  }
}
