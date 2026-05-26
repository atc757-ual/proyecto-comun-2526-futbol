import { TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let service: PlatformService;
  let platformMock: jasmine.SpyObj<Platform>;

  beforeEach(() => {
    platformMock = jasmine.createSpyObj('Platform', ['is', 'ready']);
    platformMock.is.and.returnValue(false);
    platformMock.ready.and.returnValue(Promise.resolve('dom'));

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        PlatformService,
        { provide: Platform, useValue: platformMock }
      ]
    });

    service = TestBed.inject(PlatformService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to Node backend (false) when no localStorage value', () => {
    expect(service.getUseJavaBackend()).toBeFalse();
  });

  it('should return true for Java backend when set in localStorage', () => {
    // Need to reset the module so the service re-initializes reading the new localStorage value
    localStorage.setItem('use_java_backend', 'true');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PlatformService,
        { provide: Platform, useValue: platformMock }
      ]
    });
    const fresh = TestBed.inject(PlatformService);
    expect(fresh.getUseJavaBackend()).toBeTrue();
  });

  it('setUseJavaBackend should update the backend selection', () => {
    service.setUseJavaBackend(true);
    expect(service.getUseJavaBackend()).toBeTrue();
    expect(localStorage.getItem('use_java_backend')).toBe('true');
  });

  it('setUseJavaBackend(false) should switch back to Node', () => {
    service.setUseJavaBackend(true);
    service.setUseJavaBackend(false);
    expect(service.getUseJavaBackend()).toBeFalse();
    expect(localStorage.getItem('use_java_backend')).toBe('false');
  });

  it('toggleBackend should switch from Node to Java', () => {
    service.setUseJavaBackend(false);
    service.toggleBackend();
    expect(service.getUseJavaBackend()).toBeTrue();
  });

  it('toggleBackend should switch from Java back to Node', () => {
    service.setUseJavaBackend(true);
    service.toggleBackend();
    expect(service.getUseJavaBackend()).toBeFalse();
  });

  it('useJavaBackend$ should emit the current backend value', (done) => {
    service.setUseJavaBackend(false);
    service.useJavaBackend$.subscribe(val => {
      expect(val).toBeFalse();
      done();
    });
  });

  it('isDesktop getter should reflect window width >= 768', () => {
    // ChromeHeadless starts with innerWidth=0, simulate desktop width
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    service['updatePlatformInfo']();
    expect(service.isDesktop).toBeTrue();
    // Restore
    Object.defineProperty(window, 'innerWidth', { value: 0, writable: true, configurable: true });
  });

});
