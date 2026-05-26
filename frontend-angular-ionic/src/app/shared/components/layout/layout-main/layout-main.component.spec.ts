import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LayoutMainComponent } from './layout-main.component';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MenuController, NavController, ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { of, Subject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('LayoutMainComponent', () => {
  let component: LayoutMainComponent;
  let fixture: ComponentFixture<LayoutMainComponent>;
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
    actionSheetMock.create.and.returnValue(Promise.resolve({ present: () => { }, onWillDismiss: () => Promise.resolve({ data: true }) }));
    modalMock.create.and.returnValue(Promise.resolve({ present: () => { }, onWillDismiss: () => Promise.resolve({ data: true }) }));

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), LayoutMainComponent],
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

    fixture = TestBed.createComponent(LayoutMainComponent);
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


});
