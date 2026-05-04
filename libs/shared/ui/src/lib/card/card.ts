import { Directive, HostBinding, Input } from '@angular/core';
import { uw } from '../utils/uw';

@Directive({
  selector: '[ui-card],[uiCard]',
  standalone: true,
})
export class Card {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw(
      'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
      this.className,
    );
  }
}

@Directive({
  selector: '[ui-card-header],[uiCardHeader]',
  standalone: true,
})
export class CardHeader {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw('flex flex-col gap-1.5 p-6', this.className);
  }
}

@Directive({
  selector: '[ui-card-title],[uiCardTitle]',
  standalone: true,
})
export class CardTitle {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw('font-semibold leading-none tracking-tight', this.className);
  }
}

@Directive({
  selector: '[ui-card-description],[uiCardDescription]',
  standalone: true,
})
export class CardDescription {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw('text-sm text-muted-foreground', this.className);
  }
}

@Directive({
  selector: '[ui-card-content],[uiCardContent]',
  standalone: true,
})
export class CardContent {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw('p-6 pt-0', this.className);
  }
}

@Directive({
  selector: '[ui-card-footer],[uiCardFooter]',
  standalone: true,
})
export class CardFooter {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw('flex items-center p-6 pt-0', this.className);
  }
}
