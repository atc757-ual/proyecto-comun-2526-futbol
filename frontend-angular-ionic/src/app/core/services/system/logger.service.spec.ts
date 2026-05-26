import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LoggerService] });
    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('error() should always call console.error', () => {
    spyOn(console, 'error');
    service.error('test error', new Error('boom'));
    expect(console.error).toHaveBeenCalled();
  });

  it('log() should call console.log in non-production', () => {
    spyOn(console, 'log');
    service.log('test message');
    // In dev environment production=false, so console.log is called
    expect(console.log).toHaveBeenCalled();
  });

  it('warn() should call console.warn in non-production', () => {
    spyOn(console, 'warn');
    service.warn('test warning');
    expect(console.warn).toHaveBeenCalled();
  });
});
