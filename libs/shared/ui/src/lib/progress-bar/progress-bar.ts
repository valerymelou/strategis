import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-progress-bar',
  standalone: true,
  template: `
    @if (loading) {
      <div
        class="bg-progress/20 fixed top-0 right-0 left-0 z-9999 h-0.75 overflow-hidden"
      >
        <div
          class="animate-progress-bar bg-progress h-full w-1/3 rounded-full"
        ></div>
      </div>
    }
  `,
  styles: `
    @keyframes progress-bar {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(400%);
      }
    }

    :host {
      .animate-progress-bar {
        animation: progress-bar 1.5s ease-in-out infinite;
      }
    }
  `,
})
export class ProgressBar {
  @Input() loading = false;
}
