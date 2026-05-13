import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const OTP_LENGTH = 6;

@Component({
  selector: 'ui-otp-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInput),
      multi: true,
    },
  ],
  host: { class: 'flex gap-3' },
  template: `
    @for (i of indices; track i) {
      <input
        #otpInput
        type="text"
        inputmode="numeric"
        maxlength="1"
        pattern="[0-9]"
        [value]="digits[i]"
        [disabled]="disabled"
        (input)="onInput($event, i)"
        (keydown)="onKeydown($event, i)"
        (paste)="onPaste($event)"
        (blur)="onTouched()"
        class="border-input bg-background h-12 w-12 rounded-md border text-center font-mono text-lg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
        [attr.aria-label]="'Digit ' + (i + 1) + ' of 6'"
      />
    }
  `,
})
export class OtpInput implements ControlValueAccessor {
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly indices = Array.from({ length: OTP_LENGTH }, (_, i) => i);
  digits: string[] = Array(OTP_LENGTH).fill('');
  disabled = false;

  onChange: (value: string) => void = () => void 0;
  onTouched: () => void = () => void 0;

  writeValue(value: string | null): void {
    const str = value ?? '';
    this.digits = Array.from({ length: OTP_LENGTH }, (_, i) => str[i] ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const char = input.value.replace(/\D/g, '').slice(-1);

    this.digits[index] = char;
    this.emit();

    if (char && index < OTP_LENGTH - 1) {
      this.focusAt(index + 1);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.digits[index]) {
        this.digits[index] = '';
        this.emit();
      } else if (index > 0) {
        this.digits[index - 1] = '';
        this.emit();
        this.focusAt(index - 1);
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusAt(index - 1);
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      this.focusAt(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);

    digits.split('').forEach((char, i) => {
      this.digits[i] = char;
    });
    this.emit();

    const nextEmpty = this.digits.findIndex((d) => !d);
    this.focusAt(nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty);
  }

  private focusAt(index: number): void {
    const el = this.inputs.get(index)?.nativeElement;
    el?.focus();
    el?.select();
  }

  private emit(): void {
    this.onChange(this.digits.join(''));
  }
}
