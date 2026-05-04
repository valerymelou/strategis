import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Paginator } from './paginator';

describe('Paginator', () => {
  let fixture: ComponentFixture<Paginator>;
  let component: Paginator;

  function setup(page: number, pages: number, count: number, pageSize: number) {
    fixture = TestBed.createComponent(Paginator);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pages', pages);
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Paginator],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  // ─── Computed from/to ─────────────────────────────────────────────────────

  describe('from / to', () => {
    it('returns 0 from when count is 0', () => {
      setup(1, 1, 0, 10);
      expect(component.from()).toBe(0);
    });

    it('returns 1 from on the first page', () => {
      setup(1, 3, 25, 10);
      expect(component.from()).toBe(1);
    });

    it('returns 11 from on page 2 with page size 10', () => {
      setup(2, 3, 25, 10);
      expect(component.from()).toBe(11);
    });

    it('returns count from when on the last page and count is not a multiple of pageSize', () => {
      setup(3, 3, 25, 10);
      expect(component.to()).toBe(25);
    });

    it('returns pageSize as to on a full first page', () => {
      setup(1, 3, 25, 10);
      expect(component.to()).toBe(10);
    });
  });

  // ─── prev / next emission ─────────────────────────────────────────────────

  describe('pageChange output', () => {
    it('emits page - 1 when prev() is called and page > 1', () => {
      setup(3, 5, 50, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));
      component.prev();
      expect(emitted).toEqual([2]);
    });

    it('does not emit when prev() is called on page 1', () => {
      setup(1, 5, 50, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));
      component.prev();
      expect(emitted).toEqual([]);
    });

    it('emits page + 1 when next() is called and page < pages', () => {
      setup(2, 5, 50, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));
      component.next();
      expect(emitted).toEqual([3]);
    });

    it('does not emit when next() is called on the last page', () => {
      setup(5, 5, 50, 10);
      const emitted: number[] = [];
      component.pageChange.subscribe((p) => emitted.push(p));
      component.next();
      expect(emitted).toEqual([]);
    });
  });

  // ─── Button disabled states ───────────────────────────────────────────────

  describe('button disabled states', () => {
    function prevButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelectorAll('button')[0];
    }
    function nextButton(): HTMLButtonElement {
      const btns = fixture.nativeElement.querySelectorAll('button');
      return btns[btns.length - 1];
    }

    it('disables the Previous button on page 1', () => {
      setup(1, 3, 30, 10);
      expect(prevButton().disabled).toBe(true);
    });

    it('enables the Previous button on page 2', () => {
      setup(2, 3, 30, 10);
      expect(prevButton().disabled).toBe(false);
    });

    it('disables the Next button on the last page', () => {
      setup(3, 3, 30, 10);
      expect(nextButton().disabled).toBe(true);
    });

    it('enables the Next button when not on the last page', () => {
      setup(2, 3, 30, 10);
      expect(nextButton().disabled).toBe(false);
    });
  });

  // ─── Display text ─────────────────────────────────────────────────────────

  describe('display text', () => {
    it('shows the current page and total pages', () => {
      setup(2, 5, 50, 10);
      expect(fixture.nativeElement.textContent).toContain('Page 2 of 5');
    });

    it('shows showing range when count > 0', () => {
      setup(1, 3, 25, 10);
      expect(fixture.nativeElement.textContent).toContain('Showing 1');
      expect(fixture.nativeElement.textContent).toContain('10');
      expect(fixture.nativeElement.textContent).toContain('25');
    });
  });
});
