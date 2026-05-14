import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';

import { Actor, ActorService } from '@strategis/profiles/data-access';

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
  selector: 'lib-admin-actors',
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
  templateUrl: './admin-actors.html',
})
export class AdminActors {
  private readonly actorService = inject(ActorService);

  readonly actors = signal<Actor[]>([]);
  readonly pagination = signal<{
    count: number;
    page: number;
    pages: number;
  } | null>(null);
  readonly isLoading = signal(true);
  readonly page = signal(1);
  readonly statusFilter = signal('');

  readonly statusOptions = [
    { value: '', label: $localize`:@@admin.actors.filter.all:All statuses` },
    { value: 'pending', label: $localize`:@@admin.actors.filter.pending:Pending` },
    { value: 'awaiting_documents', label: $localize`:@@admin.actors.filter.awaitingDocuments:Awaiting documents` },
    { value: 'active', label: $localize`:@@admin.actors.filter.active:Active` },
    { value: 'rejected', label: $localize`:@@admin.actors.filter.rejected:Rejected` },
    { value: 'revoked', label: $localize`:@@admin.actors.filter.revoked:Revoked` },
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

    this.actorService.listAll(query).subscribe({
      next: (result) => {
        this.actors.set(result.data);
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
