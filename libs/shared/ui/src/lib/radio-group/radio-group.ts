import {
  Component,
  Directive,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { uw } from '../utils/uw';

@Directive({
  selector: '[ui-radio-group],[uiRadioGroup]',
  standalone: true,
})
export class RadioGroup {
  @Input() className?: string;

  private readonly _items: RadioGroupItem[] = [];

  register(item: RadioGroupItem): void {
    this._items.push(item);
  }

  unregister(item: RadioGroupItem): void {
    const idx = this._items.indexOf(item);
    if (idx !== -1) this._items.splice(idx, 1);
  }

  /** Called by the selected item so siblings can uncheck themselves. */
  syncSelection(selectedItem: RadioGroupItem, value: string): void {
    this._items
      .filter((i) => i !== selectedItem)
      .forEach((i) => i._syncChecked(value));
  }

  @HostBinding('class') get computed(): string {
    return uw('flex gap-4 w-full', this.className);
  }
}

@Component({
  selector: 'ui-radio-group-item',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupItem),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      role="radio"
      [attr.aria-checked]="checked()"
      [disabled]="isDisabled() || null"
      (click)="select()"
      class="focus-visible:ring-ring flex cursor-pointer items-center gap-2 text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        class="relative flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors after:absolute after:-inset-x-3 after:-inset-y-2"
        [class.border-primary]="checked()"
        [class.border-input]="!checked()"
      >
        @if (checked()) {
          <span
            class="bg-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          ></span>
        }
      </span>
      <ng-content />
    </button>
  `,
})
export class RadioGroupItem implements ControlValueAccessor, OnInit, OnDestroy {
  readonly value = input.required<string>();

  private readonly group = inject(RadioGroup, { optional: true });

  protected readonly checked = signal(false);
  protected readonly isDisabled = signal(false);

  private _onChange: (v: string) => void = () => {
    /* noop */
  };
  private _onTouched: () => void = () => {
    /* noop */
  };

  ngOnInit(): void {
    this.group?.register(this);
  }

  ngOnDestroy(): void {
    this.group?.unregister(this);
  }

  /** Called by the parent RadioGroup to sync checked state from a sibling. */
  _syncChecked(selectedValue: string): void {
    this.checked.set(selectedValue === this.value());
  }

  writeValue(val: string): void {
    this.checked.set(val === this.value());
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected select(): void {
    if (!this.isDisabled()) {
      this.checked.set(true);
      this._onChange(this.value());
      this._onTouched();
      this.group?.syncSelection(this, this.value());
    }
  }
}
