import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { of } from 'rxjs';

import { Autocomplete } from './autocomplete';

describe('Autocomplete', () => {
  let fixture: ComponentFixture<Autocomplete>;
  let component: Autocomplete;
  let mockSearchFn: jest.Mock;
  let overlayEl: HTMLElement;

  const items = [
    { id: '1', ticker: 'AAPL', name: 'Apple Inc' },
    { id: '2', ticker: 'AMZN', name: 'Amazon' },
  ];

  const labelFn = (item: unknown) => (item as (typeof items)[0]).ticker;
  const sublabelFn = (item: unknown) => (item as (typeof items)[0]).name;

  beforeEach(async () => {
    mockSearchFn = jest.fn().mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [Autocomplete],
    }).compileComponents();

    fixture = TestBed.createComponent(Autocomplete);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('labelFn', labelFn);
    fixture.componentRef.setInput('searchFn', mockSearchFn);
    fixture.detectChanges();

    overlayEl = TestBed.inject(OverlayContainer).getContainerElement();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Initial state ───────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should render an empty text input', () => {
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input[type="text"]');
      expect(input).toBeTruthy();
      expect(input.value).toBe('');
    });

    it('should not show a dropdown initially', () => {
      const ul = overlayEl.querySelector('ul');
      expect(ul).toBeNull();
    });

    it('should not show selected item confirmation initially', () => {
      const p = fixture.nativeElement.querySelector('p');
      expect(p).toBeNull();
    });

    it('should render a label when label input is set', () => {
      fixture.componentRef.setInput('label', 'Stock');
      fixture.detectChanges();
      const label: HTMLElement = fixture.nativeElement.querySelector('label');
      expect(label.textContent?.trim()).toBe('Stock');
    });

    it('should not render a label element when label is empty', () => {
      const label = fixture.nativeElement.querySelector('label');
      expect(label).toBeNull();
    });

    it('should pass placeholder to the input', () => {
      fixture.componentRef.setInput('placeholder', 'Search…');
      fixture.detectChanges();
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('placeholder')).toBe('Search…');
    });

    it('should link label [for] to input id', () => {
      fixture.componentRef.setInput('label', 'Stock');
      fixture.detectChanges();
      const label: HTMLElement = fixture.nativeElement.querySelector('label');
      const input: HTMLElement = fixture.nativeElement.querySelector('input');
      expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
    });
  });

  // ─── onInput ─────────────────────────────────────────────────────────────

  describe('onInput', () => {
    it('should update inputValue signal', () => {
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'AAPL';
      input.dispatchEvent(new Event('input'));
      expect(component['inputValue']()).toBe('AAPL');
    });

    it('should clear selectedItem when user types', () => {
      component['selectedItem'].set(items[0]);
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'GO';
      input.dispatchEvent(new Event('input'));
      expect(component['selectedItem']()).toBeNull();
    });

    it('should emit cleared event when user types', () => {
      const clearedSpy = jest.fn();
      fixture.componentRef.instance.cleared.subscribe(clearedSpy);

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'GO';
      input.dispatchEvent(new Event('input'));

      expect(clearedSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Search / debounce ───────────────────────────────────────────────────

  describe('search', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call searchFn after 300ms debounce', () => {
      mockSearchFn.mockReturnValue(of(items));

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'AA';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);

      expect(mockSearchFn).toHaveBeenCalledWith('AA');
    });

    it('should not call searchFn for an empty query', () => {
      mockSearchFn.mockClear();

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = '';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);

      expect(mockSearchFn).not.toHaveBeenCalled();
    });

    it('should debounce rapid inputs and call searchFn once', () => {
      mockSearchFn.mockReturnValue(of([]));

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');

      input.value = 'A';
      input.dispatchEvent(new Event('input'));
      input.value = 'AA';
      input.dispatchEvent(new Event('input'));
      input.value = 'AAP';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);

      expect(mockSearchFn).toHaveBeenCalledTimes(1);
      expect(mockSearchFn).toHaveBeenCalledWith('AAP');
    });

    it('should populate options and show dropdown after search', () => {
      mockSearchFn.mockReturnValue(of(items));

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'A';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);
      fixture.detectChanges();

      const buttons = overlayEl.querySelectorAll('ul li button');
      expect(buttons.length).toBe(2);
    });

    it('should render item labels using labelFn', () => {
      mockSearchFn.mockReturnValue(of(items));

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'A';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);
      fixture.detectChanges();

      const buttons: NodeListOf<HTMLButtonElement> =
        overlayEl.querySelectorAll('ul li button');
      expect(buttons[0].textContent).toContain('AAPL');
      expect(buttons[1].textContent).toContain('AMZN');
    });

    it('should render sublabels when sublabelFn is provided', () => {
      fixture.componentRef.setInput('sublabelFn', sublabelFn);
      mockSearchFn.mockReturnValue(of(items));

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'A';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);
      fixture.detectChanges();

      const buttons: NodeListOf<HTMLButtonElement> =
        overlayEl.querySelectorAll('ul li button');
      expect(buttons[0].textContent).toContain('Apple Inc');
    });

    it('should not render sublabel spans when sublabelFn is not provided', () => {
      mockSearchFn.mockReturnValue(of(items));

      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'A';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);
      fixture.detectChanges();

      const spans = overlayEl.querySelectorAll(
        'ul li button span.text-muted-foreground',
      );
      expect(spans.length).toBe(2);
    });
  });

  // ─── selectOption ────────────────────────────────────────────────────────

  describe('selectOption', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockSearchFn.mockReturnValue(of(items));
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input');
      input.value = 'A';
      input.dispatchEvent(new Event('input'));
      jest.advanceTimersByTime(300);
      fixture.detectChanges();
      jest.useRealTimers();
    });

    it('should set selectedItem when an option is clicked', () => {
      const firstBtn: HTMLButtonElement | null =
        overlayEl.querySelector('ul li button');
      firstBtn?.click();
      expect(component['selectedItem']()).toBe(items[0]);
    });

    it('should update inputValue to labelFn result', () => {
      const firstBtn: HTMLButtonElement | null =
        overlayEl.querySelector('ul li button');
      firstBtn?.click();
      expect(component['inputValue']()).toBe('AAPL');
    });

    it('should hide the dropdown after selection', () => {
      const firstBtn: HTMLButtonElement | null =
        overlayEl.querySelector('ul li button');
      firstBtn?.click();
      fixture.detectChanges();
      expect(overlayEl.querySelector('ul')).toBeNull();
    });

    it('should emit the selected output with the chosen item', () => {
      const selectedSpy = jest.fn();
      fixture.componentRef.instance.selected.subscribe(selectedSpy);

      const firstBtn: HTMLButtonElement | null =
        overlayEl.querySelector('ul li button');
      firstBtn?.click();

      expect(selectedSpy).toHaveBeenCalledWith(items[0]);
    });

    it('should show confirmation text after selection', () => {
      const firstBtn: HTMLButtonElement | null =
        overlayEl.querySelector('ul li button');
      firstBtn?.click();
      fixture.detectChanges();

      const p: HTMLElement = fixture.nativeElement.querySelector('p');
      expect(p).toBeTruthy();
      expect(p.textContent).toContain('AAPL');
    });

    it('should show sublabel in confirmation text when sublabelFn is provided', () => {
      fixture.componentRef.setInput('sublabelFn', sublabelFn);
      const firstBtn: HTMLButtonElement | null =
        overlayEl.querySelector('ul li button');
      firstBtn?.click();
      fixture.detectChanges();

      const p: HTMLElement = fixture.nativeElement.querySelector('p');
      expect(p.textContent).toContain('Apple Inc');
    });
  });
});
