import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['syncUserWithBackend', 'logout']);
    authServiceMock.syncUserWithBackend.and.returnValue(Promise.resolve());
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when JWT token exists', () => {
    localStorage.setItem('jwt_token', 'test-jwt-token');

    http.get('/api/players').subscribe();

    const req = httpMock.expectOne('/api/players');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush([]);
  });

  it('should NOT add Authorization header when no token', () => {
    localStorage.removeItem('jwt_token');

    http.get('/api/players').subscribe();

    const req = httpMock.expectOne('/api/players');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush([]);
  });

  it('should NOT add Authorization header for /auth/signin requests', () => {
    localStorage.setItem('jwt_token', 'some-token');

    http.post('/api/auth/signin', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/signin');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({ data: { token: 'new-token' } });
  });

  it('should attempt token refresh on 401 and retry the request', fakeAsync(() => {
    localStorage.setItem('jwt_token', 'expired-token');

    http.get('/api/players').subscribe({
      next: () => expect(authServiceMock.syncUserWithBackend).toHaveBeenCalled(),
      error: () => {}
    });

    // Primera petición → 401
    const firstReq = httpMock.expectOne('/api/players');
    localStorage.setItem('jwt_token', 'refreshed-token');
    firstReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // El retry ocurre tras resolver la Promise de syncUserWithBackend (microtask)
    flushMicrotasks();

    // Ahora sí está pendiente la petición de reintento
    const retryReq = httpMock.expectOne('/api/players');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retryReq.flush([]);
  }));

  it('should redirect to /auth/login when refresh fails on 401', (done) => {
    localStorage.setItem('jwt_token', 'bad-token');
    authServiceMock.syncUserWithBackend.and.returnValue(Promise.reject(new Error('Refresh failed')));

    http.get('/api/players').subscribe({
      error: () => {
        expect(authServiceMock.logout).toHaveBeenCalled();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      }
    });

    const req = httpMock.expectOne('/api/players');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });
});
