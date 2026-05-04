import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Button, ButtonSize, ButtonVariant } from './button';

@Component({
  template: `<button
    ui-button
    [variant]="variant()"
    [size]="size()"
    [className]="extraClass()"
  >
    Click
  </button>`,
  standalone: true,
  imports: [Button],
})
class HostComponent {
  readonly variant = signal<ButtonVariant>('default');
  readonly size = signal<ButtonSize>('default');
  readonly extraClass = signal('');
}

describe('Button Directive', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    fixture = await TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getButtonEl(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  it('should apply default variant and size classes', () => {
    const el = getButtonEl();
    expect(el.className).toContain('bg-primary');
    expect(el.className).toContain('h-9');
  });

  it('should update classes when variant changes', () => {
    host.variant.set('destructive');
    fixture.detectChanges();
    const el = getButtonEl();
    expect(el.className).toContain('bg-destructive');
  });

  it('should include extraClass when provided', () => {
    host.extraClass.set('test-extra');
    fixture.detectChanges();
    const el = getButtonEl();
    expect(el.className).toContain('test-extra');
  });
});
