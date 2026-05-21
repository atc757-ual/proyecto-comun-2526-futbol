import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MenuController, NavController, ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { of, Subject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let router: Router;
  let menuCtrl: jasmine.SpyObj<MenuController>;
  let navCtrl: jasmine.SpyObj<NavController>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let platformServiceSpy: jasmine.SpyObj<PlatformService>;
  let layoutServiceSpy: jasmine.SpyObj<LayoutService>;
  let actionSheetCtrl: jasmine.SpyObj<ActionSheetController>;
  let modalCtrl: jasmine.SpyObj<ModalController>;

  beforeEach(waitForAsync(() => {
    const menuCtrlMock = jasmine.createSpyObj('MenuController', ['enable', 'close']);
    const navCtrlMock = jasmine.createSpyObj('NavController', ['navigateRoot']);
    const authServiceMock = jasmine.createSpyObj('AuthService', ['logout', 'currentUser', 'isAdmin']);
    const platformServiceMock = jasmine.createSpyObj('PlatformService', ['getUseJavaBackend']);
    const layoutServiceMock = jasmine.createSpyObj('LayoutService', [
      'showHero', 'title', 'subtitle', 'breadcrumbs', 'aiLoading', 'aiThinkingText', 'isHome'
    ]);
    const actionSheetMock = jasmine.createSpyObj('ActionSheetController', ['create']);
    const modalMock = jasmine.createSpyObj('ModalController', ['create']);
    const routerMock = { 
      url: '/home', 
      navigate: jasmine.createSpy('navigate'), 
      navigateByUrl: jasmine.createSpy('navigateByUrl'),
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
      serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/home'),
      events: of()
    };
    const activatedRouteMock = { 
      snapshot: { 
        queryParams: {},
        params: {},
        outlet: 'primary'
      },
      events: new Subject()
    };

    // Configuración inicial de mocks
    authServiceMock.currentUser.and.returnValue({ uid: '123', email: 'test@test.com' } as any);
    authServiceMock.isAdmin.and.returnValue(false);
    authServiceMock.logout.and.returnValue(Promise.resolve());
    platformServiceMock.isDesktop = true;
    platformServiceMock.isMobileApp = false;
    layoutServiceMock.showHero.and.returnValue(false);
    layoutServiceMock.title.and.returnValue('');
    layoutServiceMock.subtitle.and.returnValue('');
    layoutServiceMock.breadcrumbs.and.returnValue([]);
    layoutServiceMock.aiLoading.and.returnValue(false);
    layoutServiceMock.aiThinkingText.and.returnValue('');
    layoutServiceMock.isHome.and.returnValue(false);
    actionSheetMock.create.and.returnValue(Promise.resolve({ present: () => {}, onWillDismiss: () => Promise.resolve({ data: true }) }));
    modalMock.create.and.returnValue(Promise.resolve({ present: () => {}, onWillDismiss: () => Promise.resolve({ data: true }) }));

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MainLayoutComponent],
      providers: [
        { provide: MenuController, useValue: menuCtrlMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: ActionSheetController, useValue: actionSheetMock },
        { provide: ModalController, useValue: modalMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    
    router = TestBed.inject(Router);
    menuCtrl = TestBed.inject(MenuController) as jasmine.SpyObj<MenuController>;
    navCtrl = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    platformServiceSpy = TestBed.inject(PlatformService) as jasmine.SpyObj<PlatformService>;
    layoutServiceSpy = TestBed.inject(LayoutService) as jasmine.SpyObj<LayoutService>;
    actionSheetCtrl = TestBed.inject(ActionSheetController) as jasmine.SpyObj<ActionSheetController>;
    modalCtrl = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;

    fixture.detectChanges();
  }));

  it('should create the main layout', () => {
    expect(component).toBeTruthy();
  });

  it('should close and disable the side menu on component destruction', () => {
    component.ngOnDestroy();
    expect(menuCtrl.enable).toHaveBeenCalledWith(false);
    expect(menuCtrl.close).toHaveBeenCalled();
  });

  describe('isTabActive method navigation checks', () => {
    it('should return true for /home only if current url is exactly /home', () => {
      // Caso 1: Ruta es /home
      (router as any).url = '/home';
      expect(component.isTabActive('/home')).toBeTrue();

      // Caso 2: Ruta es diferente
      (router as any).url = '/players';
      expect(component.isTabActive('/home')).toBeFalse();
    });

    it('should return true for /players if current url contains "player" and not "public"', () => {
      // Caso 1: Detalle privado de jugador
      (router as any).url = '/player-detail/123';
      expect(component.isTabActive('/players')).toBeTrue();

      // Caso 2: Listado general
      (router as any).url = '/players';
      expect(component.isTabActive('/players')).toBeTrue();

      // Caso 3: Detalle público de jugador (debería ser falso para mantener la pestaña separada)
      (router as any).url = '/player-detail-public/123';
      expect(component.isTabActive('/players')).toBeFalse();
    });

    it('should return true for /news if current url contains "new"', () => {
      // Caso 1: Ruta de edición o creación de noticia
      (router as any).url = '/add-news';
      expect(component.isTabActive('/news')).toBeTrue();

      // Caso 2: Listado de noticias
      (router as any).url = '/news';
      expect(component.isTabActive('/news')).toBeTrue();
    });

    it('should return true for /ai-team if current url contains "ai-team"', () => {
      (router as any).url = '/ai-team';
      expect(component.isTabActive('/ai-team')).toBeTrue();
    });

    it('should return true for /busqueda if current url contains "busqueda"', () => {
      (router as any).url = '/busqueda-list';
      expect(component.isTabActive('/busqueda')).toBeTrue();
    });
  });

  describe('onBreadcrumbClick guards', () => {
    it('should prevent navigation and stop propagation if navigating to restricted areas without an active session', () => {
      authServiceSpy.currentUser.and.returnValue(null);
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
      const mockItem = { url: '/home', label: 'Inicio' };

      component.onBreadcrumbClick(mockEvent, mockItem);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should allow navigation if user is logged in', () => {
      authServiceSpy.currentUser.and.returnValue({ uid: '123', email: 'test@test.com' } as any);
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
      const mockItem = { url: '/home', label: 'Inicio' };

      component.onBreadcrumbClick(mockEvent, mockItem);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });
});
