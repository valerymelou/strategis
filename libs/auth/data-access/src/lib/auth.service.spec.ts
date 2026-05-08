import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { User, UserService } from '@strategis/users/data-access';
import { AuthService } from './auth.service';

const MOCK_USER = new User({
  id: 'abc-123',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
});

const MOCK_LOGIN_RESPONSE = {
  data: {
    id: 'abc-123',
    type: 'Login',
    attributes: {
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let userService: jest.Mocked<Pick<UserService, 'getMe'>>;

  beforeEach(() => {
    userService = { getMe: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: UserService, useValue: userService },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated is false by default', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('login()', () => {
    it('sends credentials to /auth/login/', () => {
      service.login('user@example.com', 'secret').subscribe();

      const req = httpMock.expectOne('/auth/login/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        data: {
          type: 'Login',
          attributes: { email: 'user@example.com', password: 'secret' },
        },
      });
      req.flush(MOCK_LOGIN_RESPONSE);
    });

    it('sets currentUser signal on success', () => {
      service.login('user@example.com', 'secret').subscribe();

      httpMock.expectOne('/auth/login/').flush(MOCK_LOGIN_RESPONSE);

      expect(service.currentUser()?.email).toBe('user@example.com');
      expect(service.currentUser()?.name).toBe('Test User');
    });

    it('isAuthenticated becomes true after login', () => {
      service.login('user@example.com', 'secret').subscribe();

      httpMock.expectOne('/auth/login/').flush(MOCK_LOGIN_RESPONSE);

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('logout()', () => {
    it('sends POST to /auth/logout/', () => {
      service.logout().subscribe();

      const req = httpMock.expectOne('/auth/logout/');
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('clears currentUser signal on success', () => {
      // Seed a logged-in state
      service.login('user@example.com', 'secret').subscribe();
      httpMock.expectOne('/auth/login/').flush(MOCK_LOGIN_RESPONSE);

      service.logout().subscribe();
      httpMock
        .expectOne('/auth/logout/')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('loadCurrentUser()', () => {
    it('delegates to UserService.getMe()', () => {
      userService.getMe.mockReturnValue(of(MOCK_USER));

      service.loadCurrentUser().subscribe();

      expect(userService.getMe).toHaveBeenCalledTimes(1);
    });

    it('sets currentUser signal from UserService.getMe() result', () => {
      userService.getMe.mockReturnValue(of(MOCK_USER));

      service.loadCurrentUser().subscribe();

      const user = service.currentUser();
      expect(user?.id).toBe('abc-123');
      expect(user?.email).toBe('user@example.com');
    });

    it('sets null and returns null when UserService.getMe() errors', () => {
      userService.getMe.mockReturnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' })),
      );

      let result: unknown = 'not-set';
      service.loadCurrentUser().subscribe((v) => (result = v));

      expect(result).toBeNull();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('initializeAuth()', () => {
    it('resolves without throwing when UserService.getMe() fails', async () => {
      userService.getMe.mockReturnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' })),
      );

      await expect(service.initializeAuth()).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('sets currentUser and resolves when UserService.getMe() succeeds', async () => {
      userService.getMe.mockReturnValue(of(MOCK_USER));

      await expect(service.initializeAuth()).resolves.toBeUndefined();
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('user@example.com');
    });
  });
});
