import {
  Component,
  ElementRef,
  forwardRef,
  signal,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
} from '@angular/cdk/overlay';

import { Input } from '../input/input';
import {
  COUNTRIES,
  Country,
  findCountryByDialCode,
  getFlag,
} from './countries';

@Component({
  selector: 'ui-phone-input',
  standalone: true,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, Input],
  templateUrl: './phone-input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInput),
      multi: true,
    },
  ],
})
export class PhoneInput implements ControlValueAccessor {
  @ViewChild('numberInput') numberInput!: ElementRef<HTMLInputElement>;

  protected readonly countries = COUNTRIES;
  protected readonly selectedCountry = signal<Country>(
    COUNTRIES.find((c) => c.iso === 'CM') ?? COUNTRIES[0],
  );
  protected readonly nationalNumber = signal('');
  protected readonly searchQuery = signal('');
  protected readonly isOpen = signal(false);
  protected readonly isDisabled = signal(false);

  protected readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
    },
  ];

  private onChange: (value: string) => void = () => {
    /* noop */
  };
  private onTouched: () => void = () => {
    /* noop */
  };

  protected getFlag(iso: string): string {
    return getFlag(iso);
  }

  protected get filteredCountries(): Country[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.countries;
    return this.countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso.toLowerCase().includes(q),
    );
  }

  protected openDropdown(): void {
    if (this.isDisabled()) return;
    this.searchQuery.set('');
    this.isOpen.set(true);
  }

  protected closeDropdown(): void {
    this.isOpen.set(false);
  }

  protected selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.isOpen.set(false);
    this.emit();
    this.numberInput?.nativeElement.focus();
  }

  protected onNumberInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    this.nationalNumber.set(raw);
    this.emit();
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private emit(): void {
    const national = this.nationalNumber();
    if (!national) {
      this.onChange('');
      return;
    }
    this.onChange(`${this.selectedCountry().dialCode}${national}`);
  }

  writeValue(value: string): void {
    if (!value) {
      this.nationalNumber.set('');
      return;
    }
    const country = findCountryByDialCode(value);
    if (country) {
      this.selectedCountry.set(country);
      this.nationalNumber.set(value.slice(country.dialCode.length));
    } else {
      this.nationalNumber.set(value);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
