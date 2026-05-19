import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PublicLayoutComponent } from './public-layout.component';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule, MenuController, NavController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PublicLayoutComponent', () => {
  let component: PublicLayoutComponent;
  let fixture: ComponentFixture<PublicLayoutComponent>;
  let menuCtrl: jasmine.SpyObj<MenuController>;
  let navCtrl: jasmine.SpyObj<NavController>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(waitForAsync(() => {
    const menuCtrlMock = jasmine.createSpyObj('MenuController', ['enable']);
    const navCtrlMock = jasmine.createSpyObj('NavController', ['navigateRoot']);
    const authServiceMock = jasmine.createSpyObj('AuthService', ['logout', 'currentUser']);
    const platformServiceMock = {
      isDesktop: true,
      isMobileApp: false
    };
    const layoutServiceMock = {
      breadcrumbs: () => []
    };

    authServiceMock.currentUser.and.returnValue(null);
    authServiceMock.logout.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        PublicLayoutComponent
      ],
      providers: [
        { provide: MenuController, useValue: menuCtrlMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicLayoutComponent);
    component = fixture.componentInstance;
    menuCtrl = TestBed.inject(MenuController) as jasmine.SpyObj<MenuController>;
    navCtrl = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture.detectChanges();
  }));

  it('should create the public layout', () => {
    expect(component).toBeTruthy();
  });

  it('should disable the side menu on init', () => {
    expect(menuCtrl.enable).toHaveBeenCalledWith(false);
  });

  it('should enable the side menu on destroy', () => {
    component.ngOnDestroy();
    expect(menuCtrl.enable).toHaveBeenCalledWith(true);
  });

  it('should navigate to login and call authService.logout on logout()', async () => {
    await component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(navCtrl.navigateRoot).toHaveBeenCalledWith('/login');
  });

  describe('onBreadcrumbClick checking', () => {
    it('should block navigation if restricted and no session', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
      const mockItem = { url: '/home' };
      
      component.onBreadcrumbClick(mockEvent, mockItem);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(navCtrl.navigateRoot).toHaveBeenCalledWith('/login');
    });

    it('should do nothing if allowed', () => {
      authServiceSpy.currentUser.and.returnValue({ id: '123' });
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
      const mockItem = { url: '/players' };

      component.onBreadcrumbClick(mockEvent, mockItem);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('onLogoClick navigation checking', () => {
    it('should navigate to /home if user is logged in', () => {
      authServiceSpy.currentUser.and.returnValue({ id: '123' });
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);

      component.onLogoClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(navCtrl.navigateRoot).toHaveBeenCalledWith('/home');
    });

    it('should navigate to /login if user is not logged in', () => {
      authServiceSpy.currentUser.and.returnValue(null);
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);

      component.onLogoClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(navCtrl.navigateRoot).toHaveBeenCalledWith('/login');
    });
  });
});
