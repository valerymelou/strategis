import { Component, computed, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';

import { Button } from '../button/button';

@Component({
  selector: 'ui-paginator',
  standalone: true,
  imports: [NgIconComponent, Button],
  templateUrl: './paginator.html',
  viewProviders: [provideIcons({ lucideChevronLeft, lucideChevronRight })],
})
export class Paginator {
  page = input.required<number>();
  pages = input.required<number>();
  count = input.required<number>();
  pageSize = input.required<number>();

  pageChange = output<number>();

  from = computed(() => {
    if (this.count() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  to = computed(() => Math.min(this.page() * this.pageSize(), this.count()));

  prev(): void {
    if (this.page() > 1) this.pageChange.emit(this.page() - 1);
  }

  next(): void {
    if (this.page() < this.pages()) this.pageChange.emit(this.page() + 1);
  }
}
