import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { CedCode, CedCodeService } from '@strategis/waste/data-access';
import { ToastService } from '@strategis/shared/ui';
import { ApiError } from '@vmelou/jsonapi';
import { Router } from '@angular/router';
import { AdminCedCodeDetail } from './admin-ced-code-detail';

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
    subCategoryA: 'A01',
    subCategoryALabel: 'Sub A label',
    allowedUnits: ['kg', 'ton'],
    pointsPerUnit: '2.5',
    referenceScenario: 'REF01',
    isActive: true,
    ...overrides,
  });
}

describe('AdminCedCodeDetail', () => {
  let component: AdminCedCodeDetail;
  let fixture: ComponentFixture<AdminCedCodeDetail>;
  let cedCodeService: {
    retrieve: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let toastService: { success: jest.Mock; error: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    cedCodeService = {
      retrieve: jest.fn().mockReturnValue(of(makeCedCode())),
      update: jest.fn().mockReturnValue(of(makeCedCode())),
      delete: jest.fn().mockReturnValue(of(undefined)),
    };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [AdminCedCodeDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'ced-1' } } },
        },
        { provide: CedCodeService, useValue: cedCodeService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCedCodeDetail);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadCedCode()', () => {
    it('calls retrieve with route id on init', () => {
      expect(cedCodeService.retrieve).toHaveBeenCalledWith('ced-1');
    });

    it('sets cedCode signal from response', () => {
      expect(component.cedCode()?.id).toBe('ced-1');
    });

    it('sets isLoading false after load', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('populates form with cedCode data', () => {
      expect(component.form.controls.code.value).toBe('17 02 01');
      expect(component.form.controls.subCategoryCode.value).toBe('17 02');
      expect(component.form.controls.category.value).toBe('A');
      expect(component.form.controls.isHazardous.value).toBe(false);
    });

    it('joins allowedUnits as comma-separated string in form', () => {
      expect(component.form.controls.allowedUnitsRaw.value).toBe('kg, ton');
    });

    it('shows error toast on load failure', () => {
      cedCodeService.retrieve.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      component.loadCedCode();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('sets isLoading false on load error', () => {
      cedCodeService.retrieve.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      component.loadCedCode();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('openEditForm()', () => {
    it('sets showEditForm to true', () => {
      component.openEditForm();
      expect(component.showEditForm()).toBe(true);
    });

    it('re-populates form from current cedCode', () => {
      component.form.controls.code.setValue('changed');
      component.openEditForm();
      expect(component.form.controls.code.value).toBe('17 02 01');
    });
  });

  describe('cancelEdit()', () => {
    it('sets showEditForm to false', () => {
      component.showEditForm.set(true);
      component.cancelEdit();
      expect(component.showEditForm()).toBe(false);
    });
  });

  describe('saveChanges()', () => {
    it('calls cedCodeService.update with correct data', () => {
      component.saveChanges();
      expect(cedCodeService.update).toHaveBeenCalledWith(
        'ced-1',
        expect.objectContaining({
          code: '17 02 01',
          subCategoryCode: '17 02',
          category: 'A',
          isHazardous: false,
        }),
      );
    });

    it('parses allowedUnitsRaw into allowedUnits array', () => {
      component.form.controls.allowedUnitsRaw.setValue('kg, ton, m3');
      component.saveChanges();
      expect(cedCodeService.update).toHaveBeenCalledWith(
        'ced-1',
        expect.objectContaining({ allowedUnits: ['kg', 'ton', 'm3'] }),
      );
    });

    it('sends null for empty pointsPerUnit', () => {
      component.form.controls.pointsPerUnit.setValue('');
      component.saveChanges();
      expect(cedCodeService.update).toHaveBeenCalledWith(
        'ced-1',
        expect.objectContaining({ pointsPerUnit: null }),
      );
    });

    it('sends empty string for non-nullable fields when empty', () => {
      component.form.controls.subCategoryA.setValue('');
      component.form.controls.referenceScenario.setValue('');
      component.saveChanges();
      expect(cedCodeService.update).toHaveBeenCalledWith(
        'ced-1',
        expect.objectContaining({ subCategoryA: '', referenceScenario: '' }),
      );
    });

    it('updates cedCode signal on success', () => {
      const updated = makeCedCode({ label: 'Updated Wood' });
      cedCodeService.update.mockReturnValue(of(updated));
      component.saveChanges();
      expect(component.cedCode()?.label).toBe('Updated Wood');
    });

    it('shows success toast on success', () => {
      component.saveChanges();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('hides edit form on success', () => {
      component.showEditForm.set(true);
      component.saveChanges();
      expect(component.showEditForm()).toBe(false);
    });

    it('sets isSubmitting false on success', () => {
      component.saveChanges();
      expect(component.isSubmitting()).toBe(false);
    });

    it('shows error toast on failure', () => {
      const errors: ApiError[] = [{ detail: 'Server error' } as ApiError];
      cedCodeService.update.mockReturnValue(throwError(() => errors));
      component.saveChanges();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('applies field-level apiError on failure', () => {
      const errors: ApiError[] = [
        { detail: 'Invalid code', source: 'code' } as ApiError,
      ];
      cedCodeService.update.mockReturnValue(throwError(() => errors));
      component.saveChanges();
      expect(component.form.controls.code.hasError('apiError')).toBe(true);
      expect(component.form.controls.code.getError('apiError')).toBe(
        'Invalid code',
      );
    });

    it('sets isSubmitting false on failure', () => {
      cedCodeService.update.mockReturnValue(throwError(() => []));
      component.saveChanges();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('confirmDelete()', () => {
    it('calls cedCodeService.delete with route id', () => {
      component.confirmDelete();
      expect(cedCodeService.delete).toHaveBeenCalledWith('ced-1');
    });

    it('shows success toast and navigates to list on success', () => {
      component.confirmDelete();
      expect(toastService.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/ced-codes']);
    });

    it('shows error toast on failure', () => {
      cedCodeService.delete.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      component.confirmDelete();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('sets isSubmitting false on failure', () => {
      cedCodeService.delete.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      component.confirmDelete();
      expect(component.isSubmitting()).toBe(false);
    });

    it('hides delete confirm on failure', () => {
      component.showDeleteConfirm.set(true);
      cedCodeService.delete.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      component.confirmDelete();
      expect(component.showDeleteConfirm()).toBe(false);
    });
  });
});
