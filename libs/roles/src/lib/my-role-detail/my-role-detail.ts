import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideExternalLink,
  lucideTrash2,
} from '@ng-icons/lucide';

import { Actor, ActorService } from '@strategis/profiles/data-access';
import { Badge, Button, ToastService } from '@strategis/shared/ui';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'lib-my-role-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgIconComponent,
    Badge,
    Button,
    DatePipe,
  ],
  providers: [
    provideIcons({ lucideArrowLeft, lucideExternalLink, lucideTrash2 }),
  ],
  templateUrl: './my-role-detail.html',
})
export class MyRoleDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly actorService = inject(ActorService);
  private readonly toast = inject(ToastService);

  readonly actor = signal<Actor | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly isUploading = signal(false);
  readonly showUploadForm = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly fileLabels = signal<string[]>([]);

  readonly yesLabel = $localize`:@@roles.detail.yes:Yes`;
  readonly noLabel = $localize`:@@roles.detail.no:No`;
  readonly docDefaultLabel = $localize`:@@roles.detail.docDefaultLabel:Document`;
  readonly deleteDocLabel = $localize`:@@roles.detail.deleteDoc:Delete document`;
  readonly labelPlaceholder = $localize`:@@roles.detail.labelPlaceholder:Label (optional)`;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

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
      },
      error: () => {
        this.toast.error(
          $localize`:@@roles.detail.error.loadFailed:Failed to load role.`,
        );
        this.isLoading.set(false);
      },
    });
  }

  toggleAvailability(): void {
    this.actorService.toggleAvailability(this.id).subscribe({
      next: () => {
        this.actor.update((a) =>
          a ? ({ ...a, isAvailable: !a.isAvailable } as Actor) : a,
        );
        this.toast.success(
          $localize`:@@roles.detail.success.availabilityToggled:Availability updated.`,
        );
      },
      error: () => {
        this.toast.error(
          $localize`:@@roles.detail.error.availabilityFailed:Failed to update availability.`,
        );
      },
    });
  }

  onFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.selectedFiles.set(files);
    this.fileLabels.set(files.map(() => ''));
  }

  updateLabel(index: number, value: string): void {
    this.fileLabels.update((labels) => {
      const next = [...labels];
      next[index] = value;
      return next;
    });
  }

  submitDocuments(): void {
    const files = this.selectedFiles();
    const labels = this.fileLabels();
    if (files.length === 0) return;

    const fileData = files.map((file, i) => ({
      file,
      label: labels[i] || undefined,
    }));

    this.isUploading.set(true);
    this.actorService.submitDocuments(this.id, fileData).subscribe({
      next: (docs) => {
        this.actor.update((a) => {
          if (!a) return a;
          return {
            ...a,
            documents: [...(a.documents ?? []), ...docs],
          } as Actor;
        });
        this.selectedFiles.set([]);
        this.fileLabels.set([]);
        this.showUploadForm.set(false);
        this.isUploading.set(false);
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        this.toast.success(
          $localize`:@@roles.detail.success.documentsSubmitted:Documents submitted successfully.`,
        );
      },
      error: () => {
        this.toast.error(
          $localize`:@@roles.detail.error.documentsFailed:Failed to submit documents.`,
        );
        this.isUploading.set(false);
      },
    });
  }

  deleteDocument(docId: string): void {
    this.actorService.deleteDocument(docId).subscribe({
      next: () => {
        this.actor.update((a) => {
          if (!a) return a;
          return {
            ...a,
            documents: (a.documents ?? []).filter((d) => d.id !== docId),
          } as Actor;
        });
        this.toast.success(
          $localize`:@@roles.detail.success.documentDeleted:Document deleted.`,
        );
      },
      error: () => {
        this.toast.error(
          $localize`:@@roles.detail.error.deleteFailed:Failed to delete document.`,
        );
      },
    });
  }

  canUpload(): boolean {
    const status = this.actor()?.status;
    return status !== 'active' && status !== 'revoked' && status !== 'rejected';
  }
}
