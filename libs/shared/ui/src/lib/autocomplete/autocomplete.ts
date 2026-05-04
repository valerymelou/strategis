import {
  Component,
  ElementRef,
  Input,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Input as UiInput } from '../input/input';

@Component({
  selector: 'ui-autocomplete',
  standalone: true,
  imports: [UiInput, CdkOverlayOrigin, CdkConnectedOverlay],
  templateUrl: './autocomplete.html',
})
export class Autocomplete {
  @Input() label = '';
  @Input() placeholder = '';
  @Input({ required: true }) labelFn!: (item: unknown) => string;
  @Input() sublabelFn?: (item: unknown) => string | undefined;
  @Input({ required: true }) searchFn!: (
    query: string,
  ) => Observable<unknown[]>;

  readonly selected = output<unknown>();
  readonly cleared = output<void>();

  protected readonly inputId = `ui-autocomplete-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly inputValue = signal('');
  protected readonly options = signal<unknown[]>([]);
  protected readonly selectedItem = signal<unknown | null>(null);
  protected readonly isOpen = computed(
    () => this.options().length > 0 && this.selectedItem() === null,
  );

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

  private readonly hostEl = inject(ElementRef) as ElementRef<HTMLElement>;

  protected get triggerWidth(): number {
    return this.hostEl.nativeElement.offsetWidth;
  }

  private readonly query$ = new Subject<string>();

  constructor() {
    this.query$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => (q.length >= 1 ? this.searchFn(q) : of([]))),
        takeUntilDestroyed(),
      )
      .subscribe((items) => this.options.set(items));
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.selectedItem.set(null);
    this.cleared.emit();
    this.query$.next(value);
  }

  selectOption(opt: unknown): void {
    this.selectedItem.set(opt);
    this.inputValue.set(this.labelFn(opt));
    this.options.set([]);
    this.selected.emit(opt);
  }

  closePanel(): void {
    this.options.set([]);
  }

  protected getSubLabel(opt: unknown): string | undefined {
    return this.sublabelFn?.(opt);
  }
}
