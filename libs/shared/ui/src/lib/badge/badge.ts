import { Directive, HostBinding, Input } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { uw } from '../utils/uw';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>['variant']
>;

@Directive({
  selector: '[ui-badge],[uiBadge]',
  standalone: true,
})
export class Badge {
  @Input() variant: BadgeVariant = 'default';
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw(badgeVariants({ variant: this.variant }), this.className);
  }
}
