import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import {
  CreateMixin,
  RetrieveMixin,
  UpdateMixin,
} from '@vmelou/jsonapi-angular';

import { ProfessionalProfile } from './professional-profile';

@Injectable({ providedIn: 'root' })
export class ProfessionalProfileService {
  private readonly http = inject(HttpClient);

  private readonly createMixin = new CreateMixin<ProfessionalProfile>(
    this.http,
    '/professional-profiles',
    ProfessionalProfile,
  );
  private readonly retrieveMixin = new RetrieveMixin<ProfessionalProfile>(
    this.http,
    '/professional-profiles',
    ProfessionalProfile,
  );
  private readonly updateMixin = new UpdateMixin<ProfessionalProfile>(
    this.http,
    '/professional-profiles',
    ProfessionalProfile,
  );

  create(data: Partial<ProfessionalProfile>): Observable<ProfessionalProfile> {
    return this.createMixin.create(data);
  }

  getMyProfile(): Observable<ProfessionalProfile | null> {
    return this.retrieveMixin
      .retrieve('me')
      .pipe(catchError(() => of(null)));
  }

  update(
    id: string,
    data: Partial<ProfessionalProfile>,
  ): Observable<ProfessionalProfile> {
    return this.updateMixin.update(id, data);
  }
}
