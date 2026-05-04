import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Watches the host element with IntersectionObserver and adds the CSS class
 * `aoe-visible` the first time it crosses the viewport threshold.
 *
 * Usage:
 *   <div ui-animate-on-enter [aoeDelay]="i * 60">...</div>
 *
 * Pair with CSS:
 *   [ui-animate-on-enter] { opacity: 0; }
 *   [ui-animate-on-enter].aoe-visible { animation: my-keyframe 320ms ease-out both; }
 */
@Directive({
  selector: '[ui-animate-on-enter],[uiAnimateOnEnter]',
  standalone: true,
  host: { class: 'aoe-hidden' },
})
export class AnimateOnEnter implements OnInit, OnDestroy {
  /** Delay in milliseconds before the animation starts once the card is visible. */
  aoeDelay = input(0);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const delay = this.aoeDelay();
        if (delay > 0) el.style.animationDelay = delay + 'ms';
        el.classList.add('aoe-visible');
        this.observer?.unobserve(el);
      },
      { threshold: 0.12 },
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
