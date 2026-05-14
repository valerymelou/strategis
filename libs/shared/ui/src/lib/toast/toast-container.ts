import { Component, inject } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX, lucideInfo } from '@ng-icons/lucide';

import { ToastService, ToastType } from './toast.service';

const ICON: Record<ToastType, string> = {
  success: 'lucideCheck',
  error: 'lucideX',
  info: 'lucideInfo',
};

const CLASSES: Record<ToastType, string> = {
  success:
    'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  error:
    'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20',
  info: 'border-border bg-background text-foreground',
};

const ICON_CLASSES: Record<ToastType, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  info: 'text-muted-foreground',
};

@Component({
  selector: 'ui-toast-container',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ lucideCheck, lucideX, lucideInfo })],
  template: `
    <div
      aria-live="polite"
      aria-label="Notifications"
      i18n-aria-label="@@toast.container.label"
      class="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="alert"
          class="animate-in slide-in-from-right-4 fade-in flex items-start gap-3 rounded-lg border p-4 shadow-md duration-200 {{ CLASSES[toast.type] }}"
        >
          <ng-icon
            [name]="ICON[toast.type]"
            size="16"
            class="mt-0.5 shrink-0 {{ ICON_CLASSES[toast.type] }}"
          />
          <p class="flex-1 text-sm leading-snug">{{ toast.message }}</p>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="text-current ml-auto shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
            i18n-aria-label="@@toast.dismiss.label"
          >
            <ng-icon name="lucideX" size="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  readonly toastService = inject(ToastService);
  readonly CLASSES = CLASSES;
  readonly ICON = ICON;
  readonly ICON_CLASSES = ICON_CLASSES;
}
