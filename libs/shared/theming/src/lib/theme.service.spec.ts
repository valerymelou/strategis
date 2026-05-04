import { TestBed } from '@angular/core/testing';

import { WINDOW_TOKEN, CookiesService } from '@strategis/common/browser';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let cookiesService: jest.Mocked<CookiesService>;

  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false, // Default to light theme
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const cookiesServiceMock = {
      getCookie: jest.fn(),
      setCookie: jest.fn(),
      removeCookie: jest.fn(),
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      getAllCookies: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: WINDOW_TOKEN, useValue: window },
        { provide: CookiesService, useValue: cookiesServiceMock },
      ],
    });

    cookiesService = TestBed.inject(
      CookiesService,
    ) as jest.Mocked<CookiesService>;
    service = TestBed.inject(ThemeService);
  });

  it('should change the theme', () => {
    service.changeTheme('dark');

    expect(service.theme()).toBe('dark');
    expect(cookiesService.setCookie).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should reset the theme to system preference', () => {
    service.changeTheme('system');

    expect(service.theme()).toBe('system');
    expect(cookiesService.setCookie).toHaveBeenCalledWith('theme', 'system');
  });

  it('should initialize with system preference if no cookie', () => {
    expect(service.theme()).toBe('system');
    expect(cookiesService.setCookie).toHaveBeenCalledWith('theme', 'system');
  });

  it('should initialize with cookie value if present', () => {
    // reset TestBed to re-init service with different cookie mock
    TestBed.resetTestingModule();

    const cookiesServiceMock = {
      getCookie: jest.fn().mockReturnValue('dark'),
      setCookie: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: WINDOW_TOKEN, useValue: window },
        { provide: CookiesService, useValue: cookiesServiceMock },
        ThemeService, // Provide service primarily or use inject
      ],
    });

    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('dark');
  });
});
