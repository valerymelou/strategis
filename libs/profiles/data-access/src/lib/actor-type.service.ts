import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ListMixin } from '@vmelou/jsonapi-angular';
import { Results } from '@vmelou/jsonapi';

import { ActorType } from './actor-type';

@Injectable({ providedIn: 'root' })
export class ActorTypeService {
  private readonly http = inject(HttpClient);

  private readonly listMixin = new ListMixin<ActorType>(
    this.http,
    '/actor-types',
    ActorType,
  );

  list(): Observable<Results<ActorType>> {
    return this.listMixin.list();
  }
}
