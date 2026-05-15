import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { Actor, ActorDocument, ActorService } from '@strategis/profiles/data-access';
import { ToastService } from '@strategis/shared/ui';
import { MyRoleDetail } from './my-role-detail';

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return Object.assign(new Actor(), {
    id: 'actor-1',
    actorTypeId: 'type-1',
    status: 'awaiting_documents',
    isAvailable: false,
    rejectionReason: '',
    revocationReason: '',
    documents: [],
    ...overrides,
  });
}

function makeDoc(overrides: Partial<ActorDocument> = {}): ActorDocument {
  return Object.assign(new ActorDocument(), {
    id: 'doc-1',
    actorId: 'actor-1',
    label: 'Registration',
    file: 'https://example.com/doc.pdf',
    isRequired: false,
    uploadedAt: '2024-01-01',
    adminNote: '',
    ...overrides,
  });
}

describe('MyRoleDetail', () => {
  let component: MyRoleDetail;
  let fixture: ComponentFixture<MyRoleDetail>;
  let actorService: {
    retrieve: jest.Mock;
    toggleAvailability: jest.Mock;
    submitDocuments: jest.Mock;
    deleteDocument: jest.Mock;
  };
  let toastService: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    actorService = {
      retrieve: jest.fn().mockReturnValue(of(makeActor())),
      toggleAvailability: jest.fn().mockReturnValue(of(undefined)),
      submitDocuments: jest.fn().mockReturnValue(of([])),
      deleteDocument: jest.fn().mockReturnValue(of(undefined)),
    };

    toastService = {
      toasts: signal([]) as unknown as ToastService['toasts'],
      success: jest.fn(),
      error: jest.fn(),
      dismiss: jest.fn(),
      info: jest.fn(),
    } as unknown as { success: jest.Mock; error: jest.Mock };

    await TestBed.configureTestingModule({
      imports: [MyRoleDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'actor-1' } } },
        },
        { provide: ActorService, useValue: actorService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyRoleDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('id getter', () => {
    it('returns id from route params', () => {
      expect(component.id).toBe('actor-1');
    });
  });

  describe('loadActor()', () => {
    it('calls retrieve with route id on init', () => {
      expect(actorService.retrieve).toHaveBeenCalledWith('actor-1');
    });

    it('sets actor from response', () => {
      expect(component.actor()?.id).toBe('actor-1');
    });

    it('sets isLoading false after load', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('shows error toast on load failure', () => {
      actorService.retrieve.mockReturnValue(throwError(() => new Error('fail')));
      component.loadActor();
      expect(toastService.error).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('toggleAvailability()', () => {
    it('calls toggleAvailability service with actor id', () => {
      component.toggleAvailability();
      expect(actorService.toggleAvailability).toHaveBeenCalledWith('actor-1');
    });

    it('patches actor isAvailable on success', () => {
      actorService.retrieve.mockReturnValue(of(makeActor({ isAvailable: false })));
      component.loadActor();

      component.toggleAvailability();
      expect(component.actor()?.isAvailable).toBe(true);
    });

    it('shows success toast on success', () => {
      component.toggleAvailability();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('shows error toast on failure', () => {
      actorService.toggleAvailability.mockReturnValue(throwError(() => new Error('fail')));
      component.toggleAvailability();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('deleteDocument()', () => {
    it('calls deleteDocument service with doc id', () => {
      component.deleteDocument('doc-1');
      expect(actorService.deleteDocument).toHaveBeenCalledWith('doc-1');
    });

    it('removes doc from actor signal documents array', () => {
      const doc1 = makeDoc({ id: 'doc-1' });
      const doc2 = makeDoc({ id: 'doc-2' });
      actorService.retrieve.mockReturnValue(
        of(makeActor({ documents: [doc1, doc2] })),
      );
      component.loadActor();

      component.deleteDocument('doc-1');
      expect(component.actor()?.documents?.some((d) => d.id === 'doc-1')).toBe(false);
      expect(component.actor()?.documents?.some((d) => d.id === 'doc-2')).toBe(true);
    });

    it('shows success toast on success', () => {
      component.deleteDocument('doc-1');
      expect(toastService.success).toHaveBeenCalled();
    });

    it('shows error toast on failure', () => {
      actorService.deleteDocument.mockReturnValue(throwError(() => new Error('fail')));
      component.deleteDocument('doc-1');
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('submitDocuments()', () => {
    it('does nothing when no files selected', () => {
      component.selectedFiles.set([]);
      component.submitDocuments();
      expect(actorService.submitDocuments).not.toHaveBeenCalled();
    });

    it('calls submitDocuments service with actor id and file data', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      component.selectedFiles.set([file]);
      component.fileLabels.set(['My label']);

      actorService.submitDocuments.mockReturnValue(of([]));
      component.submitDocuments();

      expect(actorService.submitDocuments).toHaveBeenCalledWith(
        'actor-1',
        [{ file, label: 'My label' }],
      );
    });

    it('appends returned docs to actor documents on success', () => {
      const existingDoc = makeDoc({ id: 'doc-existing' });
      actorService.retrieve.mockReturnValue(of(makeActor({ documents: [existingDoc] })));
      component.loadActor();

      const newDoc = makeDoc({ id: 'doc-new' });
      actorService.submitDocuments.mockReturnValue(of([newDoc]));

      const file = new File(['content'], 'test.pdf');
      component.selectedFiles.set([file]);
      component.fileLabels.set(['']);

      component.submitDocuments();

      expect(component.actor()?.documents).toHaveLength(2);
      expect(component.actor()?.documents?.[1].id).toBe('doc-new');
    });

    it('clears files and hides upload form on success', () => {
      actorService.submitDocuments.mockReturnValue(of([]));
      const file = new File(['content'], 'test.pdf');
      component.selectedFiles.set([file]);
      component.showUploadForm.set(true);

      component.submitDocuments();

      expect(component.selectedFiles()).toHaveLength(0);
      expect(component.showUploadForm()).toBe(false);
    });

    it('shows success toast on success', () => {
      actorService.submitDocuments.mockReturnValue(of([]));
      const file = new File(['content'], 'test.pdf');
      component.selectedFiles.set([file]);
      component.submitDocuments();
      expect(toastService.success).toHaveBeenCalled();
    });

    it('shows error toast on failure', () => {
      actorService.submitDocuments.mockReturnValue(throwError(() => new Error('fail')));
      const file = new File(['content'], 'test.pdf');
      component.selectedFiles.set([file]);
      component.submitDocuments();
      expect(toastService.error).toHaveBeenCalled();
    });
  });
});
