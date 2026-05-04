import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';

@Component({
  selector: 'ui-comp',
  standalone: true,
  imports: [Skeleton],
  template: `<div ui-skeleton class="h-4 w-full"></div>`,
})
class HostComponent {}

describe('Skeleton directive', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('applies default skeleton classes', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('div');
    expect(el).toBeTruthy();
    const cls = el.className;
    expect(cls).toContain('bg-muted');
    expect(cls).toContain('animate-pulse');
    expect(cls).toContain('rounded-md');
  });

  it('merges provided classes with defaults', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('div');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-full');
  });
});
