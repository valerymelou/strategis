import { Directive, HostBinding, input } from '@angular/core';
import { uw } from '../utils/uw';

@Directive({
  selector: '[ui-input],[uiInput]',
  standalone: true,
})
export class Input {
  class = input<string>();

  @HostBinding('class') get computed(): string {
    return uw(
      'flex h-9 relative w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      this.class(),
    );
  }
}
