import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, REQUEST } from '@angular/core';

import { CookiesService } from './cookies.service';

describe('CookiesService', () => {
  let service: CookiesService;

  beforeEach(() => {
    // Mock document.cookie as a simple string property to capture assignments
    let cookieStorage = '';
    Object.defineProperty(document, 'cookie', {
      get: () => cookieStorage,
      set: (val) => {
        cookieStorage += (cookieStorage ? '; ' : '') + val;
      },
      configurable: true,
    });
    // Reset cookie storage for each test
    // However, the setter above appends, which mimics browser slightly but not really (browser replaces based on key).
    // The original test treated it as a simple string property: mockDocument = { cookie: '' }.
    // Let's mimic that behavior exactly: a property that holds the string assigned to it.

    Object.defineProperty(document, 'cookie', {
      get: () => cookieStorage,
      set: (val) => {
        cookieStorage = val;
      },
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    service = TestBed.inject(CookiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get cookies', () => {
    service.setCookie('testKey', 'testValue');

    // In our simple mock, document.cookie holds the full string including attributes if set by service.
    // But service.getCookie parses document.cookie.
    // service.setCookie sets "testKey=testValue; Path=/; Secure; SameSite=Lax" (defaults)

    // The original test did:
    // service.setCookie(...)
    // mockDocument.cookie = 'testKey=testValue'; // Manually setting it for the get test?
    // const result = service.getCookie('testKey');

    // Let's look at the original test again.
    /*
    it('should set and get cookies', () => {
      service.setCookie('testKey', 'testValue');

      // Simulate the cookie being set in the browser
      mockDocument.cookie = 'testKey=testValue';

      const result = service.getCookie('testKey');
      expect(result).toBe('testValue');
    });
    */
    // It seems the original test manually updated the mock to simulate what the browser would expose (just key=value) after a set.

    // So I should preserve this logic.

    // Simulate the cookie being set in the browser (stripping attributes)
    document.cookie = 'testKey=testValue';

    const result = service.getCookie('testKey');
    expect(result).toBe('testValue');
  });

  it('should return null for non-existent cookie', () => {
    document.cookie = 'existingKey=existingValue';

    const result = service.getCookie('nonExistentKey');
    expect(result).toBeNull();
  });

  it('should set cookie with custom options', () => {
    service.setCookie('customKey', 'customValue', {
      maxAge: 3600,
      path: '/custom',
      secure: false,
    });

    expect(document.cookie).toContain('customKey=customValue');
    expect(document.cookie).toContain('Path=/custom');
    expect(document.cookie).toContain('Max-Age=3600');
    expect(document.cookie).not.toContain('Secure');
  });

  it('should remove cookies', () => {
    service.removeCookie('testKey');
    expect(document.cookie).toBe('testKey=; Path=/; Max-Age=0');
  });

  it('should get all cookies', () => {
    document.cookie = 'key1=value1; key2=value2';

    const result = service.getAllCookies();
    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
  });

  it('should clear all cookies', () => {
    document.cookie = 'key1=value1; key2=value2';
    const removeCookieSpy = jest.spyOn(service, 'removeCookie');

    service.clear();

    expect(removeCookieSpy).toHaveBeenCalledWith('key1');
    expect(removeCookieSpy).toHaveBeenCalledWith('key2');
  });

  it('should work on server with request headers', () => {
    const mockRequest = {
      headers: { get: jest.fn().mockReturnValue('serverKey=serverValue') },
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: mockRequest },
      ],
    });

    service = TestBed.inject(CookiesService);

    const result = service.getCookie('serverKey');
    expect(result).toBe('serverValue');
  });
});
