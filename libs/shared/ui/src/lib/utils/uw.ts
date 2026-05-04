import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function uw(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
