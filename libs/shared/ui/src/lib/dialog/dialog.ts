import { Directive, HostBinding, input } from '@angular/core';
import { uw } from '../utils/uw';

export type DialogSize = 'md' | 'lg';

@Directive({
  selector: '[ui-dialog],[uiDialog]',
  standalone: true,
})
export class Dialog {
  size = input<DialogSize>('md');
  class = input<string>('');

  @HostBinding('class') get computed(): string {
    return uw(
      'bg-card text-card-foreground flex flex-col gap-6 rounded-lg border border-border p-6 shadow-lg',
      this.size() === 'lg' ? 'w-[90vw] lg:max-w-6xl' : 'w-[90vw] max-w-md',
      this.class(),
    );
  }
}
