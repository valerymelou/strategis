import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideExternalLink } from '@ng-icons/lucide';

import {
  Actor,
  ActorComplianceLevel,
  ActorReliabilityLevel,
  ActorService,
} from '@strategis/profiles/data-access';
import { Badge, Button, ToastService } from '@strategis/shared/ui';

@Component({
  selector: 'lib-admin-actor-detail',
  imports: [RouterLink, ReactiveFormsModule, NgIconComponent, Badge, Button],
  providers: [provideIcons({ lucideArrowLeft, lucideExternalLink })],
  templateUrl: './admin-actor-detail.html',
})
export class AdminActorDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly actorService = inject(ActorService);
  private readonly toast = inject(ToastService);

  readonly actor = signal<Actor | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  readonly showRejectForm = signal(false);
  readonly showRevokeForm = signal(false);

  readonly rejectionReason = new FormControl('');
  readonly revocationReason = new FormControl('');
  readonly reliabilityLevel = new FormControl<ActorReliabilityLevel>(
    'validated',
  );
  readonly complianceLevel = new FormControl<ActorComplianceLevel>('compliant');

  readonly defaultDocLabel = $localize`:@@admin.actors.docDefaultLabel:Document`;

  readonly reliabilityOptions: {
    value: ActorReliabilityLevel;
    label: string;
  }[] = [
    { value: 'certified', label: $localize`:@@admin.actors.reliability.certified:Certified` },
    { value: 'validated_good_history', label: $localize`:@@admin.actors.reliability.validatedGoodHistory:Validated — Good history` },
    { value: 'validated', label: $localize`:@@admin.actors.reliability.validated:Validated` },
    { value: 'declared', label: $localize`:@@admin.actors.reliability.declared:Declared` },
    { value: 'not_validated', label: $localize`:@@admin.actors.reliability.notValidated:Not validated` },
  ];

  readonly complianceOptions: { value: ActorComplianceLevel; label: string }[] =
    [
      { value: 'approved', label: $localize`:@@admin.actors.compliance.approved:Approved` },
      { value: 'validated', label: $localize`:@@admin.actors.compliance.validated:Validated` },
      { value: 'compliant', label: $localize`:@@admin.actors.compliance.compliant:Compliant` },
      { value: 'at_risk', label: $localize`:@@admin.actors.compliance.atRisk:At risk` },
      { value: 'non_compliant', label: $localize`:@@admin.actors.compliance.nonCompliant:Non-compliant` },
    ];

  get id(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.loadActor();
  }

  loadActor(): void {
    this.isLoading.set(true);
    this.actorService.retrieve(this.id).subscribe({
      next: (actor) => {
        this.actor.set(actor);
        this.isLoading.set(false);
        if (actor.reliabilityLevel)
          this.reliabilityLevel.setValue(actor.reliabilityLevel);
        if (actor.complianceLevel)
          this.complianceLevel.setValue(actor.complianceLevel);
      },
      error: () => {
        this.toast.error($localize`:@@admin.actors.error.loadFailed:Failed to load actor.`);
        this.isLoading.set(false);
      },
    });
  }

  approve(): void {
    this.isSubmitting.set(true);
    this.actorService.validate(this.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success($localize`:@@admin.actors.success.approved:Actor approved successfully.`);
        this.loadActor();
      },
      error: () => {
        this.toast.error($localize`:@@admin.actors.error.approveFailed:Failed to approve actor.`);
        this.isSubmitting.set(false);
      },
    });
  }

  confirmReject(): void {
    const reason = this.rejectionReason.value?.trim();
    if (!reason) return;
    this.isSubmitting.set(true);
    this.actorService.reject(this.id, reason).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showRejectForm.set(false);
        this.rejectionReason.reset();
        this.toast.success($localize`:@@admin.actors.success.rejected:Actor rejected.`);
        this.loadActor();
      },
      error: () => {
        this.toast.error($localize`:@@admin.actors.error.rejectFailed:Failed to reject actor.`);
        this.isSubmitting.set(false);
      },
    });
  }

  confirmRevoke(): void {
    const reason = this.revocationReason.value?.trim();
    if (!reason) return;
    this.isSubmitting.set(true);
    this.actorService.revoke(this.id, reason).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showRevokeForm.set(false);
        this.revocationReason.reset();
        this.toast.success($localize`:@@admin.actors.success.revoked:Actor revoked.`);
        this.loadActor();
      },
      error: () => {
        this.toast.error($localize`:@@admin.actors.error.revokeFailed:Failed to revoke actor.`);
        this.isSubmitting.set(false);
      },
    });
  }

  saveReliability(): void {
    const level = this.reliabilityLevel.value;
    if (!level) return;
    this.isSubmitting.set(true);
    this.actorService.setReliability(this.id, level).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.actor.update((a) =>
          a ? ({ ...a, reliabilityLevel: level } as Actor) : a,
        );
        this.toast.success($localize`:@@admin.actors.success.reliabilityUpdated:Reliability level updated.`);
      },
      error: () => {
        this.toast.error($localize`:@@admin.actors.error.reliabilityFailed:Failed to update reliability level.`);
        this.isSubmitting.set(false);
      },
    });
  }

  saveCompliance(): void {
    const level = this.complianceLevel.value;
    if (!level) return;
    this.isSubmitting.set(true);
    this.actorService.setCompliance(this.id, level).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.actor.update((a) =>
          a ? ({ ...a, complianceLevel: level } as Actor) : a,
        );
        this.toast.success($localize`:@@admin.actors.success.complianceUpdated:Compliance level updated.`);
      },
      error: () => {
        this.toast.error($localize`:@@admin.actors.error.complianceFailed:Failed to update compliance level.`);
        this.isSubmitting.set(false);
      },
    });
  }

  toggleCategoryC(approved: boolean): void {
    this.actorService.setCategoryC(this.id, approved).subscribe({
      next: () => {
        this.actor.update((a) =>
          a ? ({ ...a, approvedForCategoryC: approved } as Actor) : a,
        );
        this.toast.success(
          approved
            ? $localize`:@@admin.actors.success.categoryC:Category C approved.`
            : $localize`:@@admin.actors.success.categoryCRemoved:Category C approval removed.`,
        );
      },
      error: () =>
        this.toast.error($localize`:@@admin.actors.error.categoryCFailed:Failed to update category C approval.`),
    });
  }
}
