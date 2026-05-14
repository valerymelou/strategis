import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import {
  PremiumUpgradeRequest,
  PremiumUpgradeRequestService,
} from '@strategis/profiles/data-access';
import {
  Badge,
  Paginator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@strategis/shared/ui';

@Component({
  selector: 'lib-admin-premium',
  imports: [
    DatePipe,
    RouterLink,
    NgIconComponent,
    Badge,
    Paginator,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeaderCell,
    TableCell,
  ],
  providers: [provideIcons({ lucideArrowRight })],
  templateUrl: './admin-premium.html',
})
export class AdminPremium {
  private readonly premiumService = inject(PremiumUpgradeRequestService);

  readonly requests = signal<PremiumUpgradeRequest[]>([]);
  readonly pagination = signal<{
    count: number;
    page: number;
    pages: number;
  } | null>(null);
  readonly isLoading = signal(true);
  readonly page = signal(1);
  readonly statusFilter = signal('');

  readonly statusOptions = [
    { value: '', label: $localize`:@@admin.premium.filter.all:All statuses` },
    { value: 'pending', label: $localize`:@@admin.premium.filter.pending:Pending` },
    { value: 'activated', label: $localize`:@@admin.premium.filter.activated:Activated` },
    { value: 'rejected', label: $localize`:@@admin.premium.filter.rejected:Rejected` },
    { value: 'expired', label: $localize`:@@admin.premium.filter.expired:Expired` },
  ];

  constructor() {
    effect(() => {
      const page = this.page();
      const status = this.statusFilter();
      this.load(page, status);
    });
  }

  private load(page: number, status: string): void {
    this.isLoading.set(true);
    const query: { [key: string]: string } = { 'page[number]': String(page) };
    if (status) query['filter[status]'] = status;

    this.premiumService.listAll(query).subscribe({
      next: (result) => {
        this.requests.set(result.data);
        this.pagination.set(result.meta.pagination);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  onPageChange(page: number): void {
    this.page.set(page);
  }
}
