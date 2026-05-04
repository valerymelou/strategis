import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ErrorHandlerService } from './error-handler.service';
import { WINDOW_TOKEN } from './tokens';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  const windowObj = { location: { reload: jest.fn() } };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WINDOW_TOKEN, useValue: windowObj },
        { provide: ErrorHandler, useClass: ErrorHandlerService },
      ],
    });
    service = TestBed.inject(ErrorHandlerService);
  });

  it('should reload the page on chunk load error', () => {
    const reloadSpy = jest.spyOn(windowObj.location, 'reload');
    service.handleError(new Error('Loading chunk 0 failed'));

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should call super.handleError for other errors', () => {
    const handleErrorSpy = jest.spyOn(service, 'handleError');
    service.handleError(new Error('Some other error'));

    expect(handleErrorSpy).toHaveBeenCalled();
  });
});
