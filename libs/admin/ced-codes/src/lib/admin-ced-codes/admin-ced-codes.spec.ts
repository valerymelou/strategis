import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { CedCode, CedCodeService } from '@strategis/waste/data-access';
import { ToastService } from '@strategis/shared/ui';
import { AdminCedCodes } from './admin-ced-codes';

function makeCedCode(overrides: Partial<CedCode> = {}): CedCode {
  return Object.assign(new CedCode(), {
    id: 'ced-1',
    code: '17 02 01',
    label: 'Wood',
    chapterCode: '17',
    subCategoryCode: '17 02',
    subCategoryLabel: 'Wood, glass, plastics',
    category: 'A' as const,
    isHazardous: false,
    isActive: true,
    ...overrides,
  });
}

const mockResult = (
  data: unknown[] = [],
  meta = { pagination: { count: 0, page: 1, pages: 1 } },
) =>
  ({ data, meta }) as ReturnType<
    CedCodeService['listAll']
  > extends import('rxjs').Observable<infer T>
    ? T
    : never;

describe('AdminCedCodes', () => {
  let component: AdminCedCodes;
  let fixture: ComponentFixture<AdminCedCodes>;
  let cedCodeService: { listAll: jest.Mock };
  let toastService: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    cedCodeService = { listAll: jest.fn().mockReturnValue(of(mockResult())) };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [AdminCedCodes],
      providers: [
        provideRouter([]),
        { provide: CedCodeService, useValue: cedCodeService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCedCodes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls listAll on init with page 1', () => {
    expect(cedCodeService.listAll).toHaveBeenCalledWith({
      'page[number]': '1',
    });
  });

  it('sets isLoading false after data loads', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('sets cedCodes from response', () => {
    const items = [makeCedCode({ id: 'a' }), makeCedCode({ id: 'b' })];
    cedCodeService.listAll.mockReturnValue(
      of(mockResult(items, { pagination: { count: 2, page: 1, pages: 1 } })),
    );
    component['load'](1, '', '', '', '');
    expect(component.cedCodes()).toHaveLength(2);
  });

  it('sets pagination from response', () => {
    cedCodeService.listAll.mockReturnValue(
      of(mockResult([], { pagination: { count: 30, page: 2, pages: 3 } })),
    );
    component['load'](2, '', '', '', '');
    expect(component.pagination()?.count).toBe(30);
    expect(component.pagination()?.pages).toBe(3);
  });

  it('shows error toast on load failure', () => {
    cedCodeService.listAll.mockReturnValue(
      throwError(() => new Error('network error')),
    );
    component['load'](1, '', '', '', '');
    expect(toastService.error).toHaveBeenCalled();
  });

  it('sets isLoading false on error', () => {
    cedCodeService.listAll.mockReturnValue(throwError(() => new Error('fail')));
    component['load'](1, '', '', '', '');
    expect(component.isLoading()).toBe(false);
  });

  it('passes search filter to listAll when set', () => {
    cedCodeService.listAll.mockReturnValue(of(mockResult()));
    component['load'](1, 'wood', '', '', '');
    expect(cedCodeService.listAll).toHaveBeenCalledWith(
      expect.objectContaining({ 'filter[search]': 'wood' }),
    );
  });

  it('passes category filter to listAll when set', () => {
    cedCodeService.listAll.mockReturnValue(of(mockResult()));
    component['load'](1, '', 'A', '', '');
    expect(cedCodeService.listAll).toHaveBeenCalledWith(
      expect.objectContaining({ 'filter[category]': 'A' }),
    );
  });

  it('passes isHazardous filter to listAll when set', () => {
    cedCodeService.listAll.mockReturnValue(of(mockResult()));
    component['load'](1, '', '', 'true', '');
    expect(cedCodeService.listAll).toHaveBeenCalledWith(
      expect.objectContaining({ 'filter[is_hazardous]': 'true' }),
    );
  });

  it('passes isActive filter to listAll when set', () => {
    cedCodeService.listAll.mockReturnValue(of(mockResult()));
    component['load'](1, '', '', '', 'false');
    expect(cedCodeService.listAll).toHaveBeenCalledWith(
      expect.objectContaining({ 'filter[is_active]': 'false' }),
    );
  });

  it('omits empty filters from listAll query', () => {
    cedCodeService.listAll.mockReturnValue(of(mockResult()));
    component['load'](1, '', '', '', '');
    expect(cedCodeService.listAll).toHaveBeenCalledWith({
      'page[number]': '1',
    });
  });

  describe('onPageChange()', () => {
    it('sets page signal', () => {
      component.onPageChange(3);
      expect(component.page()).toBe(3);
    });
  });

  describe('onSearchInput()', () => {
    it('updates searchFilter and resets page to 1', () => {
      component.page.set(2);
      const event = { target: { value: 'metal' } } as unknown as Event;
      component.onSearchInput(event);
      expect(component.searchFilter()).toBe('metal');
      expect(component.page()).toBe(1);
    });
  });

  describe('onCategoryChange()', () => {
    it('updates categoryFilter and resets page to 1', () => {
      component.page.set(3);
      const event = { target: { value: 'B' } } as unknown as Event;
      component.onCategoryChange(event);
      expect(component.categoryFilter()).toBe('B');
      expect(component.page()).toBe(1);
    });
  });

  describe('onHazardousChange()', () => {
    it('updates isHazardousFilter and resets page to 1', () => {
      component.page.set(2);
      const event = { target: { value: 'true' } } as unknown as Event;
      component.onHazardousChange(event);
      expect(component.isHazardousFilter()).toBe('true');
      expect(component.page()).toBe(1);
    });
  });

  describe('onActiveChange()', () => {
    it('updates isActiveFilter and resets page to 1', () => {
      component.page.set(2);
      const event = { target: { value: 'false' } } as unknown as Event;
      component.onActiveChange(event);
      expect(component.isActiveFilter()).toBe('false');
      expect(component.page()).toBe(1);
    });
  });
});
