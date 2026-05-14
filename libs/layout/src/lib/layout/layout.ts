import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastContainer } from '@strategis/shared/ui';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Navbar, Sidebar, ToastContainer],
  templateUrl: './layout.html',
})
export class Layout {
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
