import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

import {
  PremiumUpgradeRequest,
  PremiumUpgradeRequestService,
  UpgradePlan,
} from '@strategis/profiles/data-access';
import { Badge, Button, ToastService } from '@strategis/shared/ui';

@Component({
  selector: 'lib-admin-premium-detail',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    NgIconComponent,
    Badge,
    Button,
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './admin-premium-detail.html',
})
export class AdminPremiumDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly premiumService = inject(PremiumUpgradeRequestService);
  private readonly toast = inject(ToastService);

  readonly request = signal<PremiumUpgradeRequest | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  readonly showRejectForm = signal(false);
  readonly plan = new FormControl<UpgradePlan>('monthly');
  readonly rejectionReason = new FormControl('');

  get id(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.loadRequest();
  }

  loadRequest(): void {
    this.isLoading.set(true);
    this.premiumService.retrieve(this.id).subscribe({
      next: (req) => {
        this.request.set(req);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error($localize`:@@admin.premium.error.loadFailed:Failed to load request.`);
        this.isLoading.set(false);
      },
    });
  }

  activate(): void {
    const plan = this.plan.value;
    if (!plan) return;
    this.isSubmitting.set(true);
    this.premiumService.activate(this.id, plan).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success($localize`:@@admin.premium.success.activated:Premium request activated.`);
        this.loadRequest();
      },
      error: () => {
        this.toast.error($localize`:@@admin.premium.error.activateFailed:Failed to activate request.`);
        this.isSubmitting.set(false);
      },
    });
  }

  confirmReject(): void {
    const reason = this.rejectionReason.value?.trim();
    if (!reason) return;
    this.isSubmitting.set(true);
    this.premiumService.reject(this.id, reason).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showRejectForm.set(false);
        this.rejectionReason.reset();
        this.toast.success($localize`:@@admin.premium.success.rejected:Premium request rejected.`);
        this.loadRequest();
      },
      error: () => {
        this.toast.error($localize`:@@admin.premium.error.rejectFailed:Failed to reject request.`);
        this.isSubmitting.set(false);
      },
    });
  }
}
