import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateMixin, ListMixin, RetrieveMixin } from '@vmelou/jsonapi-angular';
import {
  deserializeCollection,
  JsonListResponse,
  Results,
} from '@vmelou/jsonapi';

import { Actor, ActorComplianceLevel, ActorReliabilityLevel } from './actor';
import { ActorDocument } from './actor-document';

@Injectable({ providedIn: 'root' })
export class ActorService {
  private readonly http = inject(HttpClient);

  private readonly createMixin = new CreateMixin<Actor>(
    this.http,
    '/actors',
    Actor,
  );
  private readonly listMixin = new ListMixin<Actor>(
    this.http,
    '/actors',
    Actor,
  );
  private readonly retrieveMixin = new RetrieveMixin<Actor>(
    this.http,
    '/actors',
    Actor,
  );

  create(data: Partial<Actor>): Observable<Actor> {
    return this.createMixin.create(data);
  }

  list(): Observable<Results<Actor>> {
    return this.listMixin.list();
  }

  listAll(query: { [key: string]: string } = {}): Observable<Results<Actor>> {
    return this.listMixin.list({ ...query, include: 'profile,actor_type' });
  }

  retrieve(id: string): Observable<Actor> {
    return this.retrieveMixin.retrieve(id, [
      'profile',
      'actor_type',
      'documents',
    ]);
  }

  validate(id: string): Observable<void> {
    return this.http.post<void>(`/actors/${id}/validate/`, {
      data: { type: 'Actor', id, attributes: {} },
    });
  }

  reject(id: string, rejectionReason: string): Observable<void> {
    return this.http.post<void>(`/actors/${id}/reject/`, {
      data: {
        type: 'Actor',
        id,
        attributes: { rejection_reason: rejectionReason },
      },
    });
  }

  revoke(id: string, revocationReason: string): Observable<void> {
    return this.http.post<void>(`/actors/${id}/revoke/`, {
      data: {
        type: 'Actor',
        id,
        attributes: { revocation_reason: revocationReason },
      },
    });
  }

  setReliability(id: string, level: ActorReliabilityLevel): Observable<void> {
    return this.http.post<void>(`/actors/${id}/set-reliability/`, {
      data: { type: 'Actor', id, attributes: { reliability_level: level } },
    });
  }

  setCompliance(id: string, level: ActorComplianceLevel): Observable<void> {
    return this.http.post<void>(`/actors/${id}/set-compliance/`, {
      data: { type: 'Actor', id, attributes: { compliance_level: level } },
    });
  }

  setCategoryC(id: string, approved: boolean): Observable<void> {
    return this.http.post<void>(`/actors/${id}/set-category-c-approval/`, {
      data: { type: 'Actor', id, attributes: { approved } },
    });
  }

  listOwn(): Observable<Results<Actor>> {
    return this.listMixin.list({ include: 'actor_type' });
  }

  submitDocuments(
    id: string,
    files: { file: File; label?: string }[],
  ): Observable<ActorDocument[]> {
    const formData = new FormData();
    files.forEach(({ file, label }) => {
      const key = crypto.randomUUID();
      formData.append(key, file);
      if (label) formData.append(`${key}_label`, label);
    });
    return this.http
      .post<JsonListResponse>(`/actors/${id}/submit-documents/`, formData)
      .pipe(
        map(
          (response) =>
            deserializeCollection(ActorDocument, response).data ?? [],
        ),
      );
  }

  toggleAvailability(id: string): Observable<void> {
    return this.http.post<void>(`/actors/${id}/toggle-availability/`, {});
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`/actor-documents/${documentId}/`);
  }
}
