import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

import { CedCategory, CedCodeService } from '@strategis/waste/data-access';
import { Button, Input, ToastService } from '@strategis/shared/ui';
import { applyApiErrors, parseJsonApiErrors } from '@strategis/common/http';
import { ApiError } from '@vmelou/jsonapi';

@Component({
  selector: 'lib-admin-ced-code-new',
  imports: [RouterLink, ReactiveFormsModule, NgIconComponent, Button, Input],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './admin-ced-code-new.html',
})
export class AdminCedCodeNew {
  private readonly router = inject(Router);
  private readonly cedCodeService = inject(CedCodeService);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);

  readonly form = new FormGroup({
    code: new FormControl('', { validators: Validators.required }),
    chapterCode: new FormControl('', { validators: Validators.required }),
    subCategoryCode: new FormControl('', { validators: Validators.required }),
    subCategoryLabel: new FormControl('', { validators: Validators.required }),
    label: new FormControl('', { validators: Validators.required }),
    isHazardous: new FormControl(false),
    category: new FormControl<CedCategory>('A', {
      nonNullable: true,
      validators: Validators.required,
    }),
    subCategoryA: new FormControl(''),
    subCategoryALabel: new FormControl(''),
    allowedUnitsRaw: new FormControl(''),
    pointsPerUnit: new FormControl(''),
    referenceScenario: new FormControl(''),
    isActive: new FormControl(true),
  });

  readonly categoryOptions: { value: CedCategory; label: string }[] = [
    { value: 'A', label: $localize`:@@cedCode.category.a:Category A` },
    { value: 'B', label: $localize`:@@cedCode.category.b:Category B` },
    { value: 'C', label: $localize`:@@cedCode.category.c:Category C` },
  ];

  get code() {
    return this.form.controls.code;
  }
  get chapterCode() {
    return this.form.controls.chapterCode;
  }
  get subCategoryCode() {
    return this.form.controls.subCategoryCode;
  }
  get subCategoryLabel() {
    return this.form.controls.subCategoryLabel;
  }
  get label() {
    return this.form.controls.label;
  }
  get category() {
    return this.form.controls.category;
  }
  get subCategoryA() {
    return this.form.controls.subCategoryA;
  }
  get subCategoryALabel() {
    return this.form.controls.subCategoryALabel;
  }
  get allowedUnitsRaw() {
    return this.form.controls.allowedUnitsRaw;
  }
  get pointsPerUnit() {
    return this.form.controls.pointsPerUnit;
  }
  get referenceScenario() {
    return this.form.controls.referenceScenario;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const v = this.form.value;
    const rawUnits = v.allowedUnitsRaw ?? '';
    const allowedUnits = rawUnits
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.cedCodeService
      .create({
        code: v.code ?? '',
        chapterCode: v.chapterCode ?? '',
        subCategoryCode: v.subCategoryCode ?? '',
        subCategoryLabel: v.subCategoryLabel ?? '',
        label: v.label ?? '',
        isHazardous: v.isHazardous ?? false,
        category: v.category ?? 'A',
        subCategoryA: v.subCategoryA ?? '',
        subCategoryALabel: v.subCategoryALabel ?? '',
        allowedUnits: allowedUnits,
        pointsPerUnit: v.pointsPerUnit || null,
        referenceScenario: v.referenceScenario ?? '',
        isActive: v.isActive ?? true,
      })
      .subscribe({
        next: (created) => {
          this.toast.success(
            $localize`:@@admin.cedCodes.success.created:CED code created successfully.`,
          );
          this.router.navigate(['/admin/ced-codes', created.id]);
        },
        error: (errors: ApiError[]) => {
          const { fieldErrors, nonFieldErrors } = parseJsonApiErrors(errors);
          applyApiErrors(this.form, fieldErrors);
          this.toast.error(
            nonFieldErrors[0] ??
              $localize`:@@admin.cedCodes.error.createFailed:Failed to create CED code.`,
          );
          this.isSubmitting.set(false);
        },
      });
  }
}
