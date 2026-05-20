import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';

import { CedCode, CedCodeService } from '@strategis/waste/data-access';
import {
  Badge,
  Button,
  Paginator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  ToastService,
} from '@strategis/shared/ui';

@Component({
  selector: 'lib-admin-ced-codes',
  imports: [
    RouterLink,
    NgIconComponent,
    Badge,
    Button,
    Paginator,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeaderCell,
    TableCell,
  ],
  providers: [provideIcons({ lucidePlus })],
  templateUrl: './admin-ced-codes.html',
})
export class AdminCedCodes {
  private readonly cedCodeService = inject(CedCodeService);
  private readonly toast = inject(ToastService);

  readonly cedCodes = signal<CedCode[]>([]);
  readonly pagination = signal<{
    count: number;
    page: number;
    pages: number;
  } | null>(null);
  readonly isLoading = signal(true);
  readonly page = signal(1);
  readonly searchFilter = signal('');
  readonly categoryFilter = signal('');
  readonly isHazardousFilter = signal('');
  readonly isActiveFilter = signal('');

  readonly categoryOptions = [
    {
      value: '',
      label: $localize`:@@admin.cedCodes.filter.allCategories:All categories`,
    },
    {
      value: 'A',
      label: $localize`:@@admin.cedCodes.filter.categoryA:Category A`,
    },
    {
      value: 'B',
      label: $localize`:@@admin.cedCodes.filter.categoryB:Category B`,
    },
    {
      value: 'C',
      label: $localize`:@@admin.cedCodes.filter.categoryC:Category C`,
    },
  ];

  readonly hazardousOptions = [
    { value: '', label: $localize`:@@admin.cedCodes.filter.allHazardous:All` },
    {
      value: 'true',
      label: $localize`:@@admin.cedCodes.filter.hazardous:Hazardous`,
    },
    {
      value: 'false',
      label: $localize`:@@admin.cedCodes.filter.nonHazardous:Non-hazardous`,
    },
  ];

  readonly activeOptions = [
    { value: '', label: $localize`:@@admin.cedCodes.filter.allActive:All` },
    { value: 'true', label: $localize`:@@admin.cedCodes.filter.active:Active` },
    {
      value: 'false',
      label: $localize`:@@admin.cedCodes.filter.inactive:Inactive`,
    },
  ];

  constructor() {
    effect(() => {
      const page = this.page();
      const search = this.searchFilter();
      const category = this.categoryFilter();
      const isHazardous = this.isHazardousFilter();
      const isActive = this.isActiveFilter();
      this.load(page, search, category, isHazardous, isActive);
    });
  }

  private load(
    page: number,
    search: string,
    category: string,
    isHazardous: string,
    isActive: string,
  ): void {
    this.isLoading.set(true);
    const query: { [key: string]: string } = {
      'page[number]': String(page),
    };
    if (search) query['filter[search]'] = search;
    if (category) query['filter[category]'] = category;
    if (isHazardous) query['filter[is_hazardous]'] = isHazardous;
    if (isActive) query['filter[is_active]'] = isActive;

    this.cedCodeService.listAll(query).subscribe({
      next: (result) => {
        this.cedCodes.set(result.data);
        this.pagination.set(result.meta.pagination);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error(
          $localize`:@@admin.cedCodes.error.loadFailed:Failed to load CED codes.`,
        );
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    this.searchFilter.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onCategoryChange(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  onHazardousChange(event: Event): void {
    this.isHazardousFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  onActiveChange(event: Event): void {
    this.isActiveFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  onPageChange(page: number): void {
    this.page.set(page);
  }
}
