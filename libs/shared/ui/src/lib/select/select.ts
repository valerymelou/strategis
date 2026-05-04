import {
  Component,
  ElementRef,
  HostListener,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideCheck } from '@ng-icons/lucide';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, NgIconComponent],
  viewProviders: [provideIcons({ lucideChevronDown, lucideCheck })],
  host: {
    class: 'relative inline-block',
  },
  template: `
    <button
      #trigger
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      [attr.aria-expanded]="open()"
      [attr.aria-haspopup]="'listbox'"
      aria-autocomplete="none"
      role="combobox"
      aria-controls="select-listbox"
      class="bg-background text-foreground ring-ring/10 border-border flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-xs transition-colors outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span>{{ selectedLabel() || placeholder() }}</span>
      <ng-icon
        name="lucideChevronDown"
        class="text-muted-foreground size-4 shrink-0 opacity-50"
      />
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="triggerWidth()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="close()"
      (detach)="close()"
    >
      <div
        role="listbox"
        [attr.aria-label]="placeholder()"
        class="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 border-border z-50 mt-1 max-h-60 overflow-auto rounded-md border p-1 shadow-md"
        (keydown)="onListKeydown($event)"
        tabindex="0"
        id="select-listbox"
      >
        @for (opt of options(); track opt.value) {
          <div
            role="option"
            [attr.aria-selected]="opt.value === value()"
            [tabindex]="opt.value === value() ? 0 : -1"
            class="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50"
            (click)="select(opt)"
            (keydown.enter)="select(opt)"
            (keydown.space)="select(opt); $event.preventDefault()"
          >
            <span>{{ opt.label }}</span>
            @if (opt.value === value()) {
              <span
                class="absolute right-2 flex size-3.5 items-center justify-center"
              >
                <ng-icon name="lucideCheck" class="size-4" />
              </span>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class Select {
  /** Two-way bound value. */
  value = model<string>('');

  /** Options to display. */
  options = input.required<SelectOption[]>();

  /** Placeholder text when no value is selected. */
  placeholder = input<string>('');

  open = signal(false);
  triggerWidth = signal(0);

  private triggerEl = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  selectedLabel = () => {
    const v = this.value();
    return this.options().find((o) => o.value === v)?.label ?? '';
  };

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.triggerWidth.set(this.triggerEl()?.nativeElement.offsetWidth ?? 200);
      this.open.set(true);
    }
  }

  close(): void {
    this.open.set(false);
  }

  select(opt: SelectOption): void {
    this.value.set(opt.value);
    this.close();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      if (!this.open()) this.toggle();
    }
  }

  onListKeydown(event: KeyboardEvent): void {
    const items = (event.currentTarget as HTMLElement)?.querySelectorAll(
      '[role="option"]',
    );
    if (!items?.length) return;

    const active = document.activeElement as HTMLElement;
    const idx = Array.from(items).indexOf(active);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = items[Math.min(idx + 1, items.length - 1)] as HTMLElement;
      next.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = items[Math.max(idx - 1, 0)] as HTMLElement;
      prev.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.triggerEl()?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }
}
