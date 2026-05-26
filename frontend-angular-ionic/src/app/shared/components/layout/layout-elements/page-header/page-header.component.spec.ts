import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';
import { PageHeaderComponent } from './page-header.component';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { NavigationService } from 'src/app/core/services/ui/navigation.service';
import { NavController, ModalController, ActionSheetController } from '@ionic/angular/standalone';

function buildMocks(isLoggedIn: boolean, isDesktop = false) {
  return {
    auth: {
      currentUser: signal(isLoggedIn ? { uid: '1', displayName: 'Test' } : null),
      logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve())
    },
    platform: { isDesktop, isMobileApp: !isDesktop },
    layout: {
      title: signal(''),
      subtitle: signal(''),
      showHero: signal(false),
      isHome: signal(false)
    },
    navService: {
      pages: [
        { label: 'Inicio', url: '/home', icon: 'home' },
        { label: 'Jugadores', url: '/players', icon: 'people' },
        { label: 'Noticias', url: '/news', icon: 'newspaper' },
        { label: 'IA', url: '/ai-team', icon: 'sparkles' },
        { label: 'Admin', url: '/admin', icon: 'settings' }
      ],
      isTabActive: jasmine.createSpy('isTabActive').and.returnValue(false),
      isCurrentHome: jasmine.createSpy('isCurrentHome').and.returnValue(false)
    },
    navCtrl: jasmine.createSpyObj('NavController', ['navigateRoot']),
    modalCtrl: jasmine.createSpyObj('ModalController', ['create']),
    actionSheetCtrl: jasmine.createSpyObj('ActionSheetController', ['create'])
  };
}

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  let navCtrlSpy: jasmine.SpyObj<NavController>;
  let authMock: any;
  let modalCtrlSpy: jasmine.SpyObj<ModalController>;
  let actionSheetCtrlSpy: jasmine.SpyObj<ActionSheetController>;

  function setup(isLoggedIn = true, isDesktop = false) {
    const mocks = buildMocks(isLoggedIn, isDesktop);
    navCtrlSpy = mocks.navCtrl as any;
    authMock = mocks.auth;
    modalCtrlSpy = mocks.modalCtrl as any;
    actionSheetCtrlSpy = mocks.actionSheetCtrl as any;

    TestBed.configureTestingModule({
      imports: [PageHeaderComponent, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: mocks.auth },
        { provide: PlatformService, useValue: mocks.platform },
        { provide: LayoutService, useValue: mocks.layout },
        { provide: NavigationService, useValue: mocks.navService },
        { provide: NavController, useValue: mocks.navCtrl },
        { provide: ModalController, useValue: mocks.modalCtrl },
        { provide: ActionSheetController, useValue: mocks.actionSheetCtrl }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('default (mobile, logged in)', () => {
    beforeEach(waitForAsync(() => setup(true, false)));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('default mode should be "main"', () => {
      expect(component.mode).toBe('main');
    });

    it('goTo() should call navCtrl.navigateRoot with the given url', () => {
      component.goTo('/players');
      expect(navCtrlSpy.navigateRoot).toHaveBeenCalledWith('/players', jasmine.any(Object));
    });

    it('onLogoClick() should navigate to /home when user is logged in', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      component.onLogoClick(event);
      expect(navCtrlSpy.navigateRoot).toHaveBeenCalledWith('/home', jasmine.any(Object));
    });

    it('showNavIcon() should return false for reserved icons', () => {
      expect(component.showNavIcon('home')).toBeFalse();
      expect(component.showNavIcon('people')).toBeFalse();
      expect(component.showNavIcon('cart')).toBeFalse();
      expect(component.showNavIcon('newspaper')).toBeFalse();
    });

    it('showNavIcon() should return true for non-reserved icons', () => {
      expect(component.showNavIcon('sparkles')).toBeTrue();
      expect(component.showNavIcon('settings')).toBeTrue();
    });

    it('logout() should call actionSheetCtrl.create on mobile', async () => {
      const sheetMock = { present: jasmine.createSpy('present').and.returnValue(Promise.resolve()) };
      actionSheetCtrlSpy.create.and.returnValue(Promise.resolve(sheetMock as any));
      await component.logout();
      expect(actionSheetCtrlSpy.create).toHaveBeenCalled();
    });
  });

  describe('when user is NOT logged in', () => {
    beforeEach(waitForAsync(() => setup(false, false)));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('onLogoClick() should navigate to /auth/login when user is not logged in', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      component.onLogoClick(event);
      expect(navCtrlSpy.navigateRoot).toHaveBeenCalledWith('/auth/login', jasmine.any(Object));
    });
  });

  describe('on desktop (isDesktop = true)', () => {
    beforeEach(waitForAsync(() => setup(true, true)));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('logout() should call modalCtrl.create on desktop', async () => {
      const modalMock = {
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
        onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: false }))
      };
      modalCtrlSpy.create.and.returnValue(Promise.resolve(modalMock as any));
      await component.logout();
      expect(modalCtrlSpy.create).toHaveBeenCalled();
    });

    it('logout() should call authService.logout when modal returns true', async () => {
      const modalMock = {
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
        onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: true }))
      };
      modalCtrlSpy.create.and.returnValue(Promise.resolve(modalMock as any));
      await component.logout();
      expect(authMock.logout).toHaveBeenCalled();
    });
  });
});
