import {
  HttpClient,
  withInterceptors,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { httpBaseUrlInterceptor } from './http-base-url.interceptor';
import { API_ROOT_TOKEN, API_VERSION_TOKEN } from './http-tokens';

describe('HttpBaseUrlInterceptor', () => {
  let client: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpBaseUrlInterceptor])),
        provideHttpClientTesting(),
        {
          provide: API_ROOT_TOKEN,
          useValue: 'https://api.strategis.com',
        },
        { provide: API_VERSION_TOKEN, useValue: 'v1' },
      ],
    });

    client = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should not modify URLs starting with http', () => {
    client.get('https://api.github.com/').subscribe();
    const request = httpMock.match({ method: 'get' })[0].request;

    expect(request.url).toBe('https://api.github.com/');
  });

  it('should add API Root endpoint', () => {
    client.get('/test').subscribe();
    const request = httpMock.match({ method: 'get' })[0].request;

    expect(request.url).toBe('https://api.strategis.com/v1/test');
  });

  it('should set withCredentials for API requests', () => {
    client.get('/test').subscribe();
    const request = httpMock.match({ method: 'get' })[0].request;

    expect(request.withCredentials).toBe(true);
  });

  it('should not set withCredentials for external URLs', () => {
    client.get('https://api.github.com/').subscribe();
    const request = httpMock.match({ method: 'get' })[0].request;

    expect(request.withCredentials).toBe(false);
  });
});
