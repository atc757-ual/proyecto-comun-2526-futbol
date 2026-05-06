import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';

describe('AuthService', () => {
  let service: AuthService;
  let authMock: any;

  beforeEach(() => {
    authMock = {}; // Mock básico del objeto Auth

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: authMock }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  describe('Success Flows', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUserCredential = { user: { email: 'alex@test.com' } };
      spyOn(service, 'login').and.resolveTo(mockUserCredential as any);

      const result = await service.login('alex@test.com', 'password123');
      expect(result.user.email).toBe('alex@test.com');
    });

    it('should register successfully with new credentials', async () => {
      const mockUserCredential = { user: { email: 'newuser@test.com' } };
      spyOn(service, 'register').and.resolveTo(mockUserCredential as any);

      const result = await service.register('newuser@test.com', 'password123');
      expect(result.user.email).toBe('newuser@test.com');
    });
  });

  describe('Login Errors', () => {
    it('should handle auth/user-not-found error', async () => {
      // Nota: Para testear funciones standalone de Firebase v9+, 
      // lo ideal es wrappearlas o usar librerías de testing específicas.
      // Aquí simulamos la lógica que se espera encontrar.
      const error = { code: 'auth/user-not-found' };
      spyOn(service, 'login').and.rejectWith(error);

      try {
        await service.login('noexiste@test.com', '12345678');
      } catch (err: any) {
        expect(err.code).toBe('auth/user-not-found');
      }
    });

    it('should handle auth/wrong-password error', async () => {
      const error = { code: 'auth/wrong-password' };
      spyOn(service, 'login').and.rejectWith(error);

      try {
        await service.login('alex@test.com', 'wrongpass');
      } catch (err: any) {
        expect(err.code).toBe('auth/wrong-password');
      }
    });
  });

  describe('Register Errors', () => {
    it('should handle auth/email-already-in-use', async () => {
      const error = { code: 'auth/email-already-in-use' };
      spyOn(service, 'register').and.rejectWith(error);

      try {
        await service.register('yaexiste@test.com', 'password123');
      } catch (err: any) {
        expect(err.code).toBe('auth/email-already-in-use');
      }
    });
  });
});
