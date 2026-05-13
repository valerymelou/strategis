import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-onboarding-shell',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class OnboardingShell {}
