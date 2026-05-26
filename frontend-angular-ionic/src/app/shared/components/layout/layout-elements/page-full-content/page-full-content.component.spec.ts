import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';
import { PageFullContentComponent } from './page-full-content.component';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { NavController } from '@ionic/angular/standalone';

function buildMocks(isLoggedIn: boolean) {
  return {
    platform: { isMobileApp: false, isDesktop: true },
    auth: { currentUser: signal(isLoggedIn ? { uid: '1' } : null) },
    navCtrl: jasmine.createSpyObj('NavController', ['navigateRoot'])
  };
}

describe('PageFullContentComponent', () => {
  let component: PageFullContentComponent;
  let fixture: ComponentFixture<PageFullContentComponent>;
  let navCtrlSpy: jasmine.SpyObj<NavController>;

  function setup(isLoggedIn: boolean) {
    const mocks = buildMocks(isLoggedIn);
    navCtrlSpy = mocks.navCtrl as any;
    TestBed.configureTestingModule({
      imports: [PageFullContentComponent, RouterModule.forRoot([])],
      providers: [
        { provide: PlatformService, useValue: mocks.platform },
        { provide: AuthService, useValue: mocks.auth },
        { provide: NavController, useValue: mocks.navCtrl }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PageFullContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('when user is logged in', () => {
    beforeEach(waitForAsync(() => setup(true)));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should accept pageTitle and pageSubtitle inputs', () => {
      component.pageTitle = 'Jugadores';
      component.pageSubtitle = 'Mi plantilla';
      expect(component.pageTitle).toBe('Jugadores');
      expect(component.pageSubtitle).toBe('Mi plantilla');
    });

    it('should accept breadcrumbs input', () => {
      component.breadcrumbs = [{ label: 'Home', url: '/home' }, { label: 'Jugadores', url: '/players' }];
      expect(component.breadcrumbs.length).toBe(2);
    });

    it('onBreadcrumbClick() should NOT redirect for a normal breadcrumb url', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      component.onBreadcrumbClick(event, { url: '/players' });
      expect(navCtrlSpy.navigateRoot).not.toHaveBeenCalled();
    });

    it('onBreadcrumbClick() should redirect to /login for item.url === /login', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      component.onBreadcrumbClick(event, { url: '/login' });
      expect(event.preventDefault).toHaveBeenCalled();
      expect(navCtrlSpy.navigateRoot).toHaveBeenCalledWith('/login', jasmine.any(Object));
    });

    it('onBreadcrumbClick() should NOT redirect /home when user is logged in', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      component.onBreadcrumbClick(event, { url: '/home' });
      expect(navCtrlSpy.navigateRoot).not.toHaveBeenCalled();
    });
  });

  describe('when user is NOT logged in', () => {
    beforeEach(waitForAsync(() => setup(false)));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('onBreadcrumbClick() should redirect /home to /login when user is not logged in', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      component.onBreadcrumbClick(event, { url: '/home' });
      expect(navCtrlSpy.navigateRoot).toHaveBeenCalledWith('/login', jasmine.any(Object));
    });
  });
});
