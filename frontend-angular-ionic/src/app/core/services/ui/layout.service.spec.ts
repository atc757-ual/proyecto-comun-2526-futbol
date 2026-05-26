import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LayoutService] });
    service = TestBed.inject(LayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setHeader() should update title and subtitle signals', () => {
    service.setHeader({ title: 'Jugadores', subtitle: 'Mi plantilla' });
    expect(service.title()).toBe('Jugadores');
    expect(service.subtitle()).toBe('Mi plantilla');
  });

  it('setHeader() should update showHero and isHome signals', () => {
    service.setHeader({ showHero: true, isHome: true });
    expect(service.showHero()).toBeTrue();
    expect(service.isHome()).toBeTrue();
  });

  it('setAuth() should update auth signals', () => {
    service.setAuth({ title: 'Login', subtitle: 'Bienvenido', isLogin: true });
    expect(service.authTitle()).toBe('Login');
    expect(service.authSubtitle()).toBe('Bienvenido');
    expect(service.isLogin()).toBeTrue();
  });

  it('setBreadcrumbs() should update breadcrumbs signal', () => {
    service.setBreadcrumbs([{ label: 'Home', url: '/home' }]);
    expect(service.breadcrumbs().length).toBe(1);
    expect(service.breadcrumbs()[0].label).toBe('Home');
  });

  it('setAILoading() should update aiLoading and aiThinkingText signals', () => {
    service.setAILoading(true, 'Analizando...');
    expect(service.aiLoading()).toBeTrue();
    expect(service.aiThinkingText()).toBe('Analizando...');
  });

  it('resetLayout() should reset all signals to defaults', () => {
    service.setHeader({ title: 'Test', showHero: true, isHome: true });
    service.setAuth({ title: 'Auth', isLogin: true });
    service.setBreadcrumbs([{ label: 'X' }]);
    service.resetLayout();
    expect(service.title()).toBe('');
    expect(service.subtitle()).toBe('');
    expect(service.showHero()).toBeFalse();
    expect(service.isHome()).toBeFalse();
    expect(service.breadcrumbs().length).toBe(0);
    expect(service.authTitle()).toBe('');
    expect(service.isLogin()).toBeFalse();
  });
});
