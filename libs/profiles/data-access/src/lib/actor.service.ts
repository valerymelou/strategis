import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMixin, ListMixin } from '@vmelou/jsonapi-angular';
import { Results } from '@vmelou/jsonapi';

import { Actor } from './actor';

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

  create(data: Partial<Actor>): Observable<Actor> {
    return this.createMixin.create(data);
  }

  list(): Observable<Results<Actor>> {
    return this.listMixin.list();
  }
}
