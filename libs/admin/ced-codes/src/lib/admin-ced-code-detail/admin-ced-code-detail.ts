import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

import {
  CedCode,
  CedCategory,
  CedCodeService,
} from '@strategis/waste/data-access';
import { Badge, Button, Input, ToastService } from '@strategis/shared/ui';
import { applyApiErrors, parseJsonApiErrors } from '@strategis/common/http';
import { ApiError } from '@vmelou/jsonapi';

@Component({
  selector: 'lib-admin-ced-code-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgIconComponent,
    Badge,
    Button,
    Input,
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './admin-ced-code-detail.html',
})
export class AdminCedCodeDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cedCodeService = inject(CedCodeService);
  private readonly toast = inject(ToastService);

  readonly cedCode = signal<CedCode | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly showEditForm = signal(false);
  readonly showDeleteConfirm = signal(false);

  readonly form = new FormGroup({
    code: new FormControl(''),
    chapterCode: new FormControl(''),
    subCategoryCode: new FormControl('', { validators: Validators.required }),
    subCategoryLabel: new FormControl('', { validators: Validators.required }),
    label: new FormControl(''),
    isHazardous: new FormControl(false),
    category: new FormControl<CedCategory>('A'),
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

  get id(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.loadCedCode();
  }

  loadCedCode(): void {
    this.isLoading.set(true);
    this.cedCodeService.retrieve(this.id).subscribe({
      next: (cedCode) => {
        this.cedCode.set(cedCode);
        this.isLoading.set(false);
        this.populateForm(cedCode);
      },
      error: () => {
        this.toast.error(
          $localize`:@@admin.cedCodes.error.loadFailed:Failed to load CED code.`,
        );
        this.isLoading.set(false);
      },
    });
  }

  private populateForm(cedCode: CedCode): void {
    this.form.patchValue({
      code: cedCode.code ?? '',
      chapterCode: cedCode.chapterCode ?? '',
      subCategoryCode: cedCode.subCategoryCode ?? '',
      subCategoryLabel: cedCode.subCategoryLabel ?? '',
      label: cedCode.label ?? '',
      isHazardous: cedCode.isHazardous ?? false,
      category: cedCode.category ?? 'A',
      subCategoryA: cedCode.subCategoryA ?? '',
      subCategoryALabel: cedCode.subCategoryALabel ?? '',
      allowedUnitsRaw: (cedCode.allowedUnits ?? []).join(', '),
      pointsPerUnit: cedCode.pointsPerUnit ?? '',
      referenceScenario: cedCode.referenceScenario ?? '',
      isActive: cedCode.isActive ?? true,
    });
  }

  openEditForm(): void {
    const current = this.cedCode();
    if (current) this.populateForm(current);
    this.showEditForm.set(true);
  }

  cancelEdit(): void {
    this.showEditForm.set(false);
  }

  saveChanges(): void {
    this.isSubmitting.set(true);
    const v = this.form.value;
    const rawUnits = v.allowedUnitsRaw ?? '';
    const allowedUnits = rawUnits
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.cedCodeService
      .update(this.id, {
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
        next: (updated) => {
          console.log('Updated CED code:', updated);
          this.cedCode.set(updated);
          this.isSubmitting.set(false);
          this.showEditForm.set(false);
          this.toast.success(
            $localize`:@@admin.cedCodes.success.updated:CED code updated successfully.`,
          );
        },
        error: (errors: ApiError[]) => {
          const { fieldErrors, nonFieldErrors } = parseJsonApiErrors(errors);
          applyApiErrors(this.form, fieldErrors);
          this.toast.error(
            nonFieldErrors[0] ??
              $localize`:@@admin.cedCodes.error.updateFailed:Failed to update CED code.`,
          );
          this.isSubmitting.set(false);
        },
      });
  }

  confirmDelete(): void {
    this.isSubmitting.set(true);
    this.cedCodeService.delete(this.id).subscribe({
      next: () => {
        this.toast.success(
          $localize`:@@admin.cedCodes.success.deleted:CED code deleted.`,
        );
        this.router.navigate(['/admin/ced-codes']);
      },
      error: () => {
        this.toast.error(
          $localize`:@@admin.cedCodes.error.deleteFailed:Failed to delete CED code.`,
        );
        this.isSubmitting.set(false);
        this.showDeleteConfirm.set(false);
      },
    });
  }
}
