import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';
import { authGuard, guestGuard, adminGuard, masterGuard, publicPlayerGuard } from './auth.guard';
import { AuthService } from '../services/auth/auth.service';

const makeRoute = (params: Record<string, string> = {}): ActivatedRouteSnapshot => {
  // ActivatedRouteSnapshot.paramMap es un getter de solo lectura en Angular moderno,
  // por eso creamos un objeto plano con la misma forma en vez de instanciar la clase.
  return {
    paramMap: { get: (key: string) => params[key] ?? null }
  } as unknown as ActivatedRouteSnapshot;
};

const makeState = (url: string): RouterStateSnapshot =>
  ({ url } as RouterStateSnapshot);

describe('Auth Guards', () => {
  let navCtrlMock: jasmine.SpyObj<NavController>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let authMock: any;

  beforeEach(() => {
    navCtrlMock = jasmine.createSpyObj('NavController', ['navigateRoot']);
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAdmin', 'isMasterAdmin']);
    authServiceMock.user$ = of(null);
    authMock = { currentUser: null };

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavController, useValue: navCtrlMock }
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  // --- authGuard ---

  describe('authGuard', () => {
    it('should return true when Firebase currentUser exists', () => {
      authMock.currentUser = { uid: 'abc' };
      const result = TestBed.runInInjectionContext(() =>
        authGuard(makeRoute(), makeState('/home'))
      );
      expect(result).toBeTrue();
    });

    it('should return true when jwt_token is in localStorage', () => {
      authMock.currentUser = null;
      localStorage.setItem('jwt_token', 'some-token');
      const result = TestBed.runInInjectionContext(() =>
        authGuard(makeRoute(), makeState('/home'))
      );
      expect(result).toBeTrue();
    });

    it('should redirect to /auth/login when no session', (done) => {
      authMock.currentUser = null;
      localStorage.removeItem('jwt_token');
      authServiceMock.user$ = of(null);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(makeRoute(), makeState('/players'))
      );

      if (typeof result === 'boolean') {
        expect(result).toBeFalse();
        done();
      } else {
        (result as any).subscribe(() => {
          expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/auth/login', jasmine.anything());
          done();
        });
      }
    });

    it('should redirect player-detail to public version when not authenticated', (done) => {
      authMock.currentUser = null;
      localStorage.removeItem('jwt_token');
      authServiceMock.user$ = of(null);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(makeRoute(), makeState('/player-detail/123'))
      );

      if (typeof result === 'boolean') {
        expect(result).toBeFalse();
        done();
      } else {
        (result as any).subscribe(() => {
          expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/player-detail-public/123', jasmine.anything());
          done();
        });
      }
    });
  });

  // --- guestGuard ---

  describe('guestGuard', () => {
    it('should return true when no session exists', () => {
      authMock.currentUser = null;
      localStorage.removeItem('jwt_token');
      const result = TestBed.runInInjectionContext(() => guestGuard());
      expect(result).toBeTrue();
    });

    it('should redirect to /home when session exists via Firebase', () => {
      authMock.currentUser = { uid: 'abc' };
      const result = TestBed.runInInjectionContext(() => guestGuard());
      expect(result).toBeFalse();
      expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/home', jasmine.anything());
    });

    it('should redirect to /home when session exists via JWT token', () => {
      authMock.currentUser = null;
      localStorage.setItem('jwt_token', 'some-token');
      const result = TestBed.runInInjectionContext(() => guestGuard());
      expect(result).toBeFalse();
      expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/home', jasmine.anything());
    });
  });

  // --- adminGuard ---

  describe('adminGuard', () => {
    it('should return true when user is admin', () => {
      authServiceMock.isAdmin.and.returnValue(true);
      const result = TestBed.runInInjectionContext(() => adminGuard());
      expect(result).toBeTrue();
    });

    it('should redirect to /home when user is not admin', () => {
      authServiceMock.isAdmin.and.returnValue(false);
      const result = TestBed.runInInjectionContext(() => adminGuard());
      expect(result).toBeFalse();
      expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/home', jasmine.anything());
    });
  });

  // --- masterGuard ---

  describe('masterGuard', () => {
    it('should return true when user is master admin', () => {
      authServiceMock.isMasterAdmin.and.returnValue(true);
      const result = TestBed.runInInjectionContext(() => masterGuard());
      expect(result).toBeTrue();
    });

    it('should redirect to /home when user is not master admin', () => {
      authServiceMock.isMasterAdmin.and.returnValue(false);
      const result = TestBed.runInInjectionContext(() => masterGuard());
      expect(result).toBeFalse();
      expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/home', jasmine.anything());
    });
  });

  // --- publicPlayerGuard ---

  describe('publicPlayerGuard', () => {
    it('should return true when no session (public access allowed)', () => {
      authMock.currentUser = null;
      localStorage.removeItem('jwt_token');
      const result = TestBed.runInInjectionContext(() =>
        publicPlayerGuard(makeRoute({ id: '123' }))
      );
      expect(result).toBeTrue();
    });

    it('should redirect to player-detail/:id when authenticated', () => {
      authMock.currentUser = { uid: 'abc' };
      const result = TestBed.runInInjectionContext(() =>
        publicPlayerGuard(makeRoute({ id: '456' }))
      );
      expect(result).toBeFalse();
      expect(navCtrlMock.navigateRoot).toHaveBeenCalledWith('/player-detail/456', jasmine.anything());
    });
  });
});
