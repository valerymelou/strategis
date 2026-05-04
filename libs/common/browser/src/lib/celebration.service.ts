import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CelebrationService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Fire confetti + haptic feedback.
   *
   * Pass the host element of the component that triggered the celebration
   * (e.g. the dialog's ElementRef.nativeElement). The canvas will be
   * appended there with `position: fixed` so it covers the full viewport,
   * while inheriting the correct stacking context and painting above the
   * CDK backdrop.
   *
   * Falls back to `document.body` when no host is provided.
   */
  celebrate(host?: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Haptic feedback — double pulse
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    void import('canvas-confetti').then(({ default: confetti }) => {
      const container = host ?? document.body;

      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '9999',
        pointerEvents: 'none',
      });
      container.appendChild(canvas);

      const fire = confetti.create(canvas, { resize: true });

      // Left cannon
      void fire({
        particleCount: 100,
        spread: 60,
        angle: 60,
        origin: { x: 0.05, y: 1 },
      });
      // Right cannon — slight delay for a staggered feel
      setTimeout(
        () =>
          void fire({
            particleCount: 100,
            spread: 60,
            angle: 120,
            origin: { x: 0.95, y: 1 },
          }),
        150,
      );

      // Remove the canvas once all particles have settled (~4 s)
      setTimeout(() => canvas.remove(), 4000);
    });
  }
}
