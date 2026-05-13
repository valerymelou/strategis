import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { OnboardingService } from '@strategis/onboarding/shell';
import { PremiumUpgradeRequestService } from '@strategis/profiles/data-access';
import { Button } from '@strategis/shared/ui';

@Component({
  selector: 'app-onboarding-plan',
  imports: [Button],
  templateUrl: './onboarding-plan.html',
  host: { class: 'flex flex-col min-w-sm' },
})
export class OnboardingPlan {
  private readonly upgradeService = inject(PremiumUpgradeRequestService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly isLoadingFree = signal(false);
  readonly isLoadingPremium = signal(false);
  readonly errorMessage = signal<string | null>(null);

  selectFree(): void {
    this.router.navigate(['/onboarding/role']);
  }

  selectPremium(): void {
    const profile = this.onboardingService.profile();
    if (!profile?.id) {
      this.router.navigate(['/onboarding/role']);
      return;
    }

    this.isLoadingPremium.set(true);
    this.errorMessage.set(null);

    this.upgradeService.requestUpgrade(profile.id).subscribe({
      next: () => {
        this.isLoadingPremium.set(false);
        window.open('https://wa.me/33600000000', '_blank');
        this.router.navigate(['/onboarding/role']);
      },
      error: () => {
        this.isLoadingPremium.set(false);
        // Still open WhatsApp and continue even on error
        window.open('https://wa.me/33600000000', '_blank');
        this.router.navigate(['/onboarding/role']);
      },
    });
  }
}
