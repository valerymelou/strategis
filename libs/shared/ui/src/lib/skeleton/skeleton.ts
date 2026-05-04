import { Directive, HostBinding, Input } from '@angular/core';
import { uw } from '../utils/uw';

@Directive({
  selector: '[ui-skeleton],[uiSkeleton]',
  standalone: true,
})
export class Skeleton {
  @Input() className = '';

  @HostBinding('class') get computed(): string {
    return uw('bg-muted animate-pulse rounded-md', this.className);
  }
}
