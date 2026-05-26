import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Auth } from '@angular/fire/auth';
import { Platform } from '@ionic/angular/standalone';
import { AuthService } from './auth.service';
import { PlatformService } from '../system/platform.service';
import { PreferencesPlugin } from '../../plugins/preferences-plugin';

// Minimal Auth mock compatible with @angular/fire user() observable
const authMock = {
  currentUser: null,
  authStateReady: jasmine.createSpy('authStateReady').and.returnValue(Promise.resolve()),
  // Firebase SDK calls this via getModularInstance(auth)._onAuthStateChanged
  _onAuthStateChanged: (nextOrObserver: any) => {
    if (typeof nextOrObserver === 'function') nextOrObserver(null);
    return () => {};
  },
  // Needed by some Firebase internals
  _getRecaptchaConfig: () => null,
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Auth, useValue: authMock },
        { provide: Platform, useValue: { ready: () => Promise.resolve(), is: () => false } },
        {
          provide: PlatformService,
          useValue: { getUseJavaBackend: () => false }
        },
        {
          provide: PreferencesPlugin,
          useValue: {
            get: jasmine.createSpy('get').and.returnValue(Promise.resolve(null)),
            set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
            clear: jasmine.createSpy('clear').and.returnValue(Promise.resolve())
          }
        }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- isAdmin ---

  it('isAdmin should return false when there is no JWT token', () => {
    localStorage.removeItem('jwt_token');
    expect(service.isAdmin()).toBeFalse();
  });

  it('isAdmin should return true when JWT contains role=admin', () => {
    const payload = { role: 'admin', id: 'uid123' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('jwt_token', token);
    expect(service.isAdmin()).toBeTrue();
  });

  it('isAdmin should return true for role=ADMIN (Java backend)', () => {
    const payload = { role: 'ADMIN', id: '1' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('jwt_token', token);
    expect(service.isAdmin()).toBeTrue();
  });

  it('isAdmin should return false for role=user', () => {
    const payload = { role: 'user', id: 'uid123' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('jwt_token', token);
    expect(service.isAdmin()).toBeFalse();
  });

  // --- isMasterAdmin ---

  it('isMasterAdmin should return false when there is no JWT token', () => {
    localStorage.removeItem('jwt_token');
    expect(service.isMasterAdmin()).toBeFalse();
  });

  it('isMasterAdmin should return true when JWT contains master=true', () => {
    const payload = { role: 'admin', master: true, id: 'uid123' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('jwt_token', token);
    expect(service.isMasterAdmin()).toBeTrue();
  });

  it('isMasterAdmin should return false when master is false', () => {
    const payload = { role: 'admin', master: false, id: 'uid123' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('jwt_token', token);
    expect(service.isMasterAdmin()).toBeFalse();
  });

  // --- getUID ---

  it('getUID should return undefined when no user and no token', () => {
    localStorage.removeItem('jwt_token');
    expect(service.getUID()).toBeUndefined();
  });

  it('getUID should extract id from JWT token as fallback', () => {
    const payload = { id: 'firebase_uid_123', role: 'user' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('jwt_token', token);
    expect(service.getUID()).toBe('firebase_uid_123');
  });

  // --- getUserData / firstName ---

  it('getUserData should return null initially', () => {
    expect(service.getUserData()).toBeNull();
  });

  it('firstName should return empty string when no user data', () => {
    expect(service.firstName()).toBe('');
  });

  it('userData should be null when not logged in', () => {
    expect(service.userData()).toBeNull();
  });

  // --- logout ---

  it('logout should clear localStorage', async () => {
    localStorage.setItem('jwt_token', 'some-token');
    localStorage.setItem('other_key', 'value');

    try { await service.logout(); } catch { /* Firebase signOut may fail in test env */ }

    expect(localStorage.getItem('jwt_token')).toBeNull();
  });
});
