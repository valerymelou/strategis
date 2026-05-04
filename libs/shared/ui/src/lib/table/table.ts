import { Directive, HostBinding, Input } from '@angular/core';
import { uw } from '../utils/uw';

@Directive({
  selector: 'table[ui-table],table[uiTable]',
  standalone: true,
})
export class Table {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw(
      'bg-card w-full caption-bottom text-sm rounded-md',
      this.className,
    );
  }
}

@Directive({
  selector: 'thead[ui-thead],thead[uiThead]',
  standalone: true,
})
export class TableHead {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw('[&_tr]:border-b [&_tr]:border-border', this.className);
  }
}

@Directive({
  selector: 'tbody[ui-tbody],tbody[uiTbody]',
  standalone: true,
})
export class TableBody {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw(
      '[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-muted/30',
      this.className,
    );
  }
}

@Directive({
  selector: 'tr[ui-tr],tr[uiTr]',
  standalone: true,
})
export class TableRow {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw(
      'border-b border-border data-[state=selected]:bg-muted',
      this.className,
    );
  }
}

@Directive({
  selector: 'th[ui-th],th[uiTh]',
  standalone: true,
})
export class TableHeaderCell {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      this.className,
    );
  }
}

@Directive({
  selector: 'td[ui-td],td[uiTd]',
  standalone: true,
})
export class TableCell {
  @Input() className?: string;

  @HostBinding('class') get computed(): string {
    return uw('p-4 align-middle [&:has([role=checkbox])]:pr-0', this.className);
  }
}
