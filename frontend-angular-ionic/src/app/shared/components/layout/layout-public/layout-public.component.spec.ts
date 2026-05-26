import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { LayoutPublicComponent } from './layout-public.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { MenuController, NavController, ModalController } from '@ionic/angular/standalone';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { NavigationService, APP_PAGES } from 'src/app/core/services/ui/navigation.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Auth } from '@angular/fire/auth';

describe('LayoutPublicComponent', () => {
  let component: LayoutPublicComponent;
  let fixture: ComponentFixture<LayoutPublicComponent>;
  let menuCtrl: jasmine.SpyObj<MenuController>;
  let navCtrl: jasmine.SpyObj<NavController>;
  let modalCtrl: jasmine.SpyObj<ModalController>;

  const mockModal = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: false }))
  };

  beforeEach(waitForAsync(() => {
    menuCtrl   = jasmine.createSpyObj('MenuController', ['enable']);
    navCtrl    = jasmine.createSpyObj('NavController', ['navigateRoot']);
    modalCtrl  = jasmine.createSpyObj('ModalController', ['create']);

    menuCtrl.enable.and.returnValue(Promise.resolve(undefined));
    modalCtrl.create.and.returnValue(Promise.resolve(mockModal as any));

    const navServiceMock = jasmine.createSpyObj('NavigationService', [
      'isTabActive', 'isCurrentHome', 'goBack'
    ]) as jasmine.SpyObj<NavigationService> & { pages: typeof APP_PAGES };
    navServiceMock.pages = APP_PAGES;
    navServiceMock.isTabActive.and.returnValue(false);

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), RouterTestingModule, HttpClientTestingModule, LayoutPublicComponent],
      providers: [
        { provide: MenuController,  useValue: menuCtrl   },
        { provide: NavController,   useValue: navCtrl    },
        { provide: ModalController, useValue: modalCtrl  },
        { provide: PlatformService, useValue: { isDesktop: true, isMobileApp: false } },
        { provide: NavigationService, useValue: navServiceMock },
        {
          provide: Auth,
          useValue: {
            onIdTokenChanged: () => () => {},
            currentUser: null,
            app: { options: {} }
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture   = TestBed.createComponent(LayoutPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the public layout', () => {
    expect(component).toBeTruthy();
  });

  describe('menu management', () => {
    it('should disable the side menu on init', () => {
      expect(menuCtrl.enable).toHaveBeenCalledWith(false);
    });

    it('should re-enable the side menu on destroy', () => {
      component.ngOnDestroy();
      expect(menuCtrl.enable).toHaveBeenCalledWith(true);
    });
  });

  describe('onTabClick — unauthenticated user flow', () => {
    it('should prevent default navigation and open the join modal', fakeAsync(() => {
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
      component.onTabClick(mockEvent, null, 0);
      tick();

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(modalCtrl.create).toHaveBeenCalled();
    }));

    it('should NOT navigate to register when user dismisses the modal', fakeAsync(() => {
      mockModal.onWillDismiss.and.returnValue(Promise.resolve({ data: false }));
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
      component.onTabClick(mockEvent, null, 0);
      tick();

      expect(navCtrl.navigateRoot).not.toHaveBeenCalled();
    }));

    it('should navigate to /auth/register when user confirms modal', fakeAsync(() => {
      mockModal.onWillDismiss.and.returnValue(Promise.resolve({ data: true }));
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
      component.onTabClick(mockEvent, null, 0);
      tick();

      expect(navCtrl.navigateRoot).toHaveBeenCalledWith('/auth/register', { animated: false });
    }));
  });

  describe('navigation service integration', () => {
    it('should expose the navService', () => {
      expect(component.navService).toBeTruthy();
    });

    it('navService should have 5 pages', () => {
      expect(component.navService.pages.length).toBe(5);
    });
  });
});
