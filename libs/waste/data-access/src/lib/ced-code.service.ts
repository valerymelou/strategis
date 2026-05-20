import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateMixin,
  DeleteMixin,
  ListMixin,
  RetrieveMixin,
  UpdateMixin,
} from '@vmelou/jsonapi-angular';
import { Results } from '@vmelou/jsonapi';

import { CedCode } from './ced-code';

@Injectable({ providedIn: 'root' })
export class CedCodeService {
  private readonly http = inject(HttpClient);

  private readonly listMixin = new ListMixin<CedCode>(
    this.http,
    '/ced-codes',
    CedCode,
  );
  private readonly retrieveMixin = new RetrieveMixin<CedCode>(
    this.http,
    '/ced-codes',
    CedCode,
  );
  private readonly createMixin = new CreateMixin<CedCode>(
    this.http,
    '/ced-codes',
    CedCode,
  );
  private readonly updateMixin = new UpdateMixin<CedCode>(
    this.http,
    '/ced-codes',
    CedCode,
  );
  private readonly deleteMixin = new DeleteMixin<CedCode>(
    this.http,
    '/ced-codes',
    CedCode,
  );

  listAll(query: { [key: string]: string } = {}): Observable<Results<CedCode>> {
    return this.listMixin.list({ ...query });
  }

  retrieve(id: string): Observable<CedCode> {
    return this.retrieveMixin.retrieve(id);
  }

  create(data: Partial<CedCode>): Observable<CedCode> {
    return this.createMixin.create(data);
  }

  update(id: string, data: Partial<CedCode>): Observable<CedCode> {
    return this.updateMixin.update(id, data);
  }

  delete(id: string): Observable<void> {
    return this.deleteMixin.delete(id);
  }
}
