import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from './auth.service';
import { httpAuthInterceptor } from './http-auth.interceptor';

describe('httpAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpAuthInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it('retries the original request after a successful refresh', () => {
    http.get('/api/resource').subscribe();

    // First attempt → 401
    httpMock.expectOne('/api/resource').flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    // Interceptor calls refresh
    httpMock
      .expectOne('/auth/refresh/')
      .flush({}, { status: 200, statusText: 'OK' });

    // Retry of original request
    httpMock
      .expectOne('/api/resource')
      .flush({ data: 'ok' }, { status: 200, statusText: 'OK' });
  });

  it('navigates to /auth/login when refresh fails', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    http.get('/api/resource').subscribe({ error: () => void 0 });

    httpMock.expectOne('/api/resource').flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );
    httpMock.expectOne('/auth/refresh/').flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    expect(authService.currentUser()).toBeNull();
  });

  it('does NOT retry when the 401 is from an /auth/ endpoint', () => {
    http.get('/auth/refresh/').subscribe({ error: () => void 0 });

    httpMock.expectOne('/auth/refresh/').flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    // No additional requests should have been made
    httpMock.expectNone('/auth/refresh/');
  });
});
