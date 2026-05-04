import { Directive, HostBinding, Input } from '@angular/core';
import { uw } from '../utils/uw';

@Directive({
  selector: '[ui-separator],[uiSeparator]',
  standalone: true,
  host: {
    role: 'separator',
  },
})
export class Separator {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() className?: string;

  @HostBinding('attr.aria-orientation') get ariaOrientation(): string {
    return this.orientation;
  }

  @HostBinding('class') get computed(): string {
    const base = 'shrink-0 bg-border';
    const orientationClass =
      this.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full';
    return uw(base, orientationClass, this.className);
  }
}
