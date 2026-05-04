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
