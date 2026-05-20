import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { CedCode, CedCodeService } from '@strategis/waste/data-access';
import { ToastService } from '@strategis/shared/ui';
import { ApiError } from '@vmelou/jsonapi';
import { AdminCedCodeNew } from './admin-ced-code-new';

function makeCedCode(overrides: Partial<CedCode> = {}): CedCode {
  return Object.assign(new CedCode(), {
    id: 'ced-new-1',
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

describe('AdminCedCodeNew', () => {
  let component: AdminCedCodeNew;
  let fixture: ComponentFixture<AdminCedCodeNew>;
  let cedCodeService: { create: jest.Mock };
  let toastService: { success: jest.Mock; error: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    cedCodeService = { create: jest.fn().mockReturnValue(of(makeCedCode())) };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [AdminCedCodeNew],
      providers: [
        provideRouter([]),
        { provide: CedCodeService, useValue: cedCodeService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCedCodeNew);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('form is invalid when required fields are empty', () => {
      expect(component.form.invalid).toBe(true);
    });

    it('form is valid when all required fields are filled', () => {
      component.form.patchValue({
        code: '17 02 01',
        chapterCode: '17',
        subCategoryCode: '17 02',
        subCategoryLabel: 'Wood, glass, plastics',
        label: 'Wood',
      });
      expect(component.form.valid).toBe(true);
    });

    it('subCategoryCode is required', () => {
      expect(component.form.controls.subCategoryCode.hasError('required')).toBe(
        true,
      );
    });

    it('subCategoryLabel is required', () => {
      expect(
        component.form.controls.subCategoryLabel.hasError('required'),
      ).toBe(true);
    });
  });

  describe('submit()', () => {
    beforeEach(() => {
      component.form.patchValue({
        code: '17 02 01',
        chapterCode: '17',
        subCategoryCode: '17 02',
        subCategoryLabel: 'Wood, glass, plastics',
        label: 'Wood',
      });
    });

    it('does not call create when form is invalid', () => {
      component.form.controls.code.setValue('');
      component.submit();
      expect(cedCodeService.create).not.toHaveBeenCalled();
    });

    it('marks all controls as touched when form is invalid', () => {
      component.form.controls.code.setValue('');
      component.submit();
      expect(component.form.controls.code.touched).toBe(true);
      expect(component.form.controls.subCategoryCode.touched).toBe(true);
    });

    it('calls cedCodeService.create with correct data', () => {
      component.submit();
      expect(cedCodeService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: '17 02 01',
          chapterCode: '17',
          subCategoryCode: '17 02',
          subCategoryLabel: 'Wood, glass, plastics',
          label: 'Wood',
          category: 'A',
          isHazardous: false,
          isActive: true,
        }),
      );
    });

    it('parses allowedUnitsRaw into allowedUnits array', () => {
      component.form.controls.allowedUnitsRaw.setValue('kg, ton, m3');
      component.submit();
      expect(cedCodeService.create).toHaveBeenCalledWith(
        expect.objectContaining({ allowedUnits: ['kg', 'ton', 'm3'] }),
      );
    });

    it('sends null for empty pointsPerUnit', () => {
      component.form.controls.pointsPerUnit.setValue('');
      component.submit();
      expect(cedCodeService.create).toHaveBeenCalledWith(
        expect.objectContaining({ pointsPerUnit: null }),
      );
    });

    it('sends empty string for non-nullable fields when empty', () => {
      component.form.controls.subCategoryA.setValue('');
      component.form.controls.referenceScenario.setValue('');
      component.submit();
      expect(cedCodeService.create).toHaveBeenCalledWith(
        expect.objectContaining({ subCategoryA: '', referenceScenario: '' }),
      );
    });

    it('shows success toast on success', () => {
      component.submit();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('navigates to the new ced code detail page on success', () => {
      component.submit();
      expect(router.navigate).toHaveBeenCalledWith([
        '/admin/ced-codes',
        'ced-new-1',
      ]);
    });

    it('shows error toast on failure', () => {
      const errors: ApiError[] = [{ detail: 'Server error' } as ApiError];
      cedCodeService.create.mockReturnValue(throwError(() => errors));
      component.submit();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('applies field-level apiError on failure', () => {
      const errors: ApiError[] = [
        { detail: 'Code already exists', source: 'code' } as ApiError,
      ];
      cedCodeService.create.mockReturnValue(throwError(() => errors));
      component.submit();
      expect(component.form.controls.code.hasError('apiError')).toBe(true);
      expect(component.form.controls.code.getError('apiError')).toBe(
        'Code already exists',
      );
    });

    it('sets isSubmitting false on failure', () => {
      cedCodeService.create.mockReturnValue(throwError(() => []));
      component.submit();
      expect(component.isSubmitting()).toBe(false);
    });
  });
});
