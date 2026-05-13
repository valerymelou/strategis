/// <reference types="google.maps" />
import {
  Component,
  ElementRef,
  InjectionToken,
  OnDestroy,
  OnInit,
  ViewChild,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { Input as UiInput } from '../input/input';

export const GOOGLE_MAPS_API_KEY_TOKEN = new InjectionToken<string>(
  'Google Maps API key',
);

export interface GeoPoint {
  lat: number;
  lng: number;
  formattedAddress: string;
}

@Component({
  selector: 'ui-places-autocomplete',
  imports: [UiInput],
  templateUrl: './places-autocomplete.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PlacesAutocomplete),
      multi: true,
    },
  ],
})
export class PlacesAutocomplete implements ControlValueAccessor, OnInit, OnDestroy {
  private readonly apiKey = inject(GOOGLE_MAPS_API_KEY_TOKEN);

  @ViewChild('inputEl', { static: true }) inputEl!: ElementRef<HTMLInputElement>;

  protected readonly inputValue = signal('');
  protected readonly hasValue = signal(false);
  protected readonly isLoadingLocation = signal(false);
  protected readonly isDisabled = signal(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly suggestions = signal<any[]>([]); // PlacePrediction[]
  protected readonly showDropdown = signal(false);
  protected readonly focusedIndex = signal(-1);

  private sessionToken: unknown = null;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private placesLoaded = false;

  _onChange: (val: GeoPoint | null) => void = () => {};
  _onTouched: () => void = () => {};

  ngOnInit(): void {
    setOptions({ key: this.apiKey, v: 'weekly' });
    importLibrary('places').then(() => {
      this.placesLoaded = true;
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounceTimer);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    if (!value) {
      this.hasValue.set(false);
      this._onChange(null);
      this._clearSuggestions();
      return;
    }

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this._fetchSuggestions(value), 300);
  }

  onBlur(): void {
    // Delay so mousedown on a suggestion fires before blur closes the dropdown
    setTimeout(() => {
      this.showDropdown.set(false);
      this._onTouched();
    }, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    const list = this.suggestions();
    if (!this.showDropdown() || list.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.set(Math.min(this.focusedIndex() + 1, list.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.set(Math.max(this.focusedIndex() - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (this.focusedIndex() >= 0) {
          this.selectSuggestion(list[this.focusedIndex()]);
        }
        break;
      case 'Escape':
        this._clearSuggestions();
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async selectSuggestion(prediction: any): Promise<void> {
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['formattedAddress', 'location'] });

      if (place.location) {
        const geoPoint: GeoPoint = {
          lat: place.location.lat(),
          lng: place.location.lng(),
          formattedAddress: place.formattedAddress ?? '',
        };
        this.inputValue.set(geoPoint.formattedAddress);
        this.inputEl.nativeElement.value = geoPoint.formattedAddress;
        this.hasValue.set(true);
        this._clearSuggestions();
        this.sessionToken = null; // end billing session on selection
        this._onChange(geoPoint);
        this._onTouched();
      }
    } catch {
      // ignore
    }
  }

  useMyLocation(): void {
    if (!navigator.geolocation) return;
    this.isLoadingLocation.set(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let formattedAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });
          if (result.results[0]?.formatted_address) {
            formattedAddress = result.results[0].formatted_address;
          }
        } catch {
          // fall back to coordinates
        }

        const geoPoint: GeoPoint = { lat, lng, formattedAddress };
        this.inputValue.set(formattedAddress);
        this.inputEl.nativeElement.value = formattedAddress;
        this.hasValue.set(true);
        this.isLoadingLocation.set(false);
        this._onChange(geoPoint);
        this._onTouched();
      },
      () => {
        this.isLoadingLocation.set(false);
      },
    );
  }

  clear(): void {
    this.inputValue.set('');
    this.inputEl.nativeElement.value = '';
    this.hasValue.set(false);
    this._clearSuggestions();
    this.sessionToken = null;
    this._onChange(null);
    this._onTouched();
  }

  writeValue(val: GeoPoint | null): void {
    const address = val?.formattedAddress ?? '';
    this.inputValue.set(address);
    this.hasValue.set(val !== null);
    if (this.inputEl?.nativeElement) {
      this.inputEl.nativeElement.value = address;
    }
    this._clearSuggestions();
  }

  registerOnChange(fn: (val: GeoPoint | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  private async _fetchSuggestions(input: string): Promise<void> {
    if (!this.placesLoaded) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const places = google.maps.places as any;
      if (!this.sessionToken) {
        this.sessionToken = new places.AutocompleteSessionToken();
      }
      const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: this.sessionToken,
        types: ['geocode'],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.suggestions.set(suggestions.map((s: any) => s.placePrediction));
      this.showDropdown.set(suggestions.length > 0);
      this.focusedIndex.set(-1);
    } catch {
      this._clearSuggestions();
    }
  }

  private _clearSuggestions(): void {
    this.suggestions.set([]);
    this.showDropdown.set(false);
    this.focusedIndex.set(-1);
  }
}
