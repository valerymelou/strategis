import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RetrieveMixin } from '@vmelou/jsonapi-angular';

import { User } from './user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly retrieveMixin: RetrieveMixin<User> = new RetrieveMixin<User>(
    this.http,
    '/users',
    User,
  );

  getMe(): Observable<User> {
    return this.retrieveMixin.retrieve('me', ['profile', 'profile.actors']);
  }
}
