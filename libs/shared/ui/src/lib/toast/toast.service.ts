import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string, duration = 4000): void {
    this._add(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this._add(message, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this._add(message, 'info', duration);
  }

  dismiss(id: string): void {
    this.toasts.update((ts) => ts.filter((t) => t.id !== id));
  }

  private _add(message: string, type: ToastType, duration: number): void {
    const id = crypto.randomUUID();
    this.toasts.update((ts) => [...ts, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
