import {
  Directive,
  HostBinding,
  HostListener,
  inject,
  input,
  model,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { uw } from '../utils/uw';

// ---------------------------------------------------------------------------
// Toggle variant styles (shared between Toggle and ToggleGroupItem)
// ---------------------------------------------------------------------------

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 whitespace-nowrap outline-none shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
      },
      size: {
        default: 'h-9 px-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ToggleVariant = NonNullable<
  VariantProps<typeof toggleVariants>['variant']
>;
export type ToggleSize = NonNullable<
  VariantProps<typeof toggleVariants>['size']
>;

// ---------------------------------------------------------------------------
// ToggleGroup — the container directive
// ---------------------------------------------------------------------------

/**
 * Container for a set of toggle buttons. Tracks the active value and exposes
 * it as a two-way bindable `model`.
 *
 * Usage:
 * ```html
 * <div ui-toggle-group variant="outline" [(value)]="dataMode">
 *   <button ui-toggle-group-item value="a">A</button>
 *   <button ui-toggle-group-item value="b">B</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[ui-toggle-group],[uiToggleGroup]',
  standalone: true,
  host: { 'data-slot': 'toggle-group' },
})
export class ToggleGroup {
  variant = input<ToggleVariant>('default');
  size = input<ToggleSize>('default');
  spacing = input(0);
  orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Currently active item value. Supports `[(value)]` two-way binding. */
  value = model<string>('');

  // data-* attributes used by Tailwind modifiers on ToggleGroupItem
  @HostBinding('attr.data-variant') get _dVariant() {
    return this.variant();
  }
  @HostBinding('attr.data-size') get _dSize() {
    return this.size();
  }
  @HostBinding('attr.data-spacing') get _dSpacing() {
    return this.spacing();
  }
  // Boolean presence attrs — group-data-horizontal/toggle-group and group-data-vertical/toggle-group
  @HostBinding('attr.data-horizontal') get _dH() {
    return this.orientation() === 'horizontal' ? '' : null;
  }
  @HostBinding('attr.data-vertical') get _dV() {
    return this.orientation() === 'vertical' ? '' : null;
  }

  @HostBinding('class') get classes(): string {
    return uw(
      'group/toggle-group rounded-lg flex w-fit items-center',
      this.orientation() === 'vertical' ? 'flex-col items-stretch' : 'flex-row',
    );
  }

  select(val: string): void {
    this.value.set(val);
  }
}

// ---------------------------------------------------------------------------
// ToggleGroupItem — each button inside the group
// ---------------------------------------------------------------------------

/**
 * A button within a `ui-toggle-group`. Reads variant/size/spacing context
 * from the parent group and marks itself active via `data-state="on"`.
 */
@Directive({
  selector: '[ui-toggle-group-item],[uiToggleGroupItem]',
  standalone: true,
  host: { 'data-slot': 'toggle-group-item' },
})
export class ToggleGroupItem {
  private readonly group = inject(ToggleGroup);

  /** The value this item represents; must match one of the group's possible values. */
  itemValue = input.required<string>();
  className = input('');

  @HostBinding('attr.data-state') get _state() {
    return this.group.value() === this.itemValue() ? 'on' : 'off';
  }
  @HostBinding('attr.data-variant') get _variant() {
    return this.group.variant();
  }
  @HostBinding('attr.data-size') get _size() {
    return this.group.size();
  }
  @HostBinding('attr.data-spacing') get _spacing() {
    return this.group.spacing();
  }

  @HostBinding('class') get classes(): string {
    return uw(
      'border-border',
      // Spacing-0 group: collapse individual border-radius, tighten padding
      'group-data-[spacing=0]/toggle-group:rounded-none',
      'group-data-[spacing=0]/toggle-group:px-2',
      // Round only the outer corners of first/last items
      'group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg',
      'group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg',
      'group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg',
      'group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg',
      'shrink-0',
      // Outline variant: remove redundant borders between adjacent items, keep outer ones
      'group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0',
      'group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0',
      'group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l',
      'group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t',
      toggleVariants({
        variant: this.group.variant(),
        size: this.group.size(),
      }),
      this.className(),
    );
  }

  @HostListener('click')
  onClick(): void {
    this.group.select(this.itemValue());
  }
}
