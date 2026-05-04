import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { httpBaseHeadersInterceptor } from './http-base-headers.interceptor';
import { API_CONTENT_TYPE_TOKEN, API_VERSION_TOKEN } from './http-tokens';

describe('HttpBaseHeadersInterceptor', () => {
  let client: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpBaseHeadersInterceptor])),
        provideHttpClientTesting(),
        {
          provide: API_CONTENT_TYPE_TOKEN,
          useValue: 'application/vnd.api+json',
        },
        { provide: API_VERSION_TOKEN, useValue: 'v1' },
      ],
    });

    client = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should not modify headers of requests starting with http', () => {
    client.get('https://api.github.com/').subscribe();
    const request = httpMock.match({ method: 'get' })[0].request;

    expect(request.headers.get('Content-Type')).toEqual(null);
    expect(request.headers.get('Accept')).toEqual(null);
  });

  it('should set the content type and accept headers', () => {
    client.get('/test').subscribe();
    const request = httpMock.match({ method: 'get' })[0].request;

    expect(request.headers.get('Content-Type')).toEqual(
      'application/vnd.api+json',
    );
    expect(request.headers.get('Accept')).toEqual(
      'application/vnd.api+json; version=v1',
    );
  });
});
