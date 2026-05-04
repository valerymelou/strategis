import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';

@Component({
  selector: 'ui-tooltip',
  standalone: true,
  host: { class: 'inline-flex items-center' },
  template: `
    <ng-content />
    @if (visible()) {
      <div
        class="pointer-events-none fixed z-9999 -translate-x-1/2 -translate-y-full
               whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5
               text-xs text-background shadow-md"
        [style.top.px]="top()"
        [style.left.px]="left()"
      >
        {{ text() }}
      </div>
    }
  `,
})
export class Tooltip {
  text = input.required<string>();

  private readonly el = inject(ElementRef);

  protected readonly visible = signal(false);
  protected readonly top = signal(0);
  protected readonly left = signal(0);

  @HostListener('mouseenter')
  protected show(): void {
    const rect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
    this.top.set(rect.top - 6);
    this.left.set(rect.left + rect.width / 2);
    this.visible.set(true);
  }

  @HostListener('mouseleave')
  protected hide(): void {
    this.visible.set(false);
  }
}
