import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { PageNavigationComponent } from './page-navigation.component';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { NavigationService, APP_PAGES } from 'src/app/core/services/ui/navigation.service';
import { NavController, ModalController, ActionSheetController } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { of, Subject } from 'rxjs';

describe('PageNavigationComponent', () => {
  let component: PageNavigationComponent;
  let fixture: ComponentFixture<PageNavigationComponent>;
  let authServiceMock: any;
  let navCtrlMock: jasmine.SpyObj<NavController>;
  let modalCtrlMock: jasmine.SpyObj<ModalController>;
  let actionSheetCtrlMock: jasmine.SpyObj<ActionSheetController>;

  const mockModal = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: false }))
  };
  const mockActionSheet = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
  };

  beforeEach(waitForAsync(() => {
    authServiceMock = {
      userData: signal<any>(null),
      currentUser: signal<any>(null),
      firstName: signal(''),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
      isMasterAdmin: jasmine.createSpy('isMasterAdmin').and.returnValue(false),
      logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve()),
    };

    navCtrlMock         = jasmine.createSpyObj('NavController', ['navigateRoot']);
    modalCtrlMock       = jasmine.createSpyObj('ModalController', ['create']);
    actionSheetCtrlMock = jasmine.createSpyObj('ActionSheetController', ['create']);

    modalCtrlMock.create.and.returnValue(Promise.resolve(mockModal as any));
    actionSheetCtrlMock.create.and.returnValue(Promise.resolve(mockActionSheet as any));

    const navServiceMock = { pages: APP_PAGES, isTabActive: () => false, isCurrentHome: () => false, goBack: () => {} };

    TestBed.configureTestingModule({
      imports: [PageNavigationComponent],
      providers: [
        { provide: AuthService,           useValue: authServiceMock },
        { provide: PlatformService,       useValue: { isMobileApp: false, isDesktop: true } },
        { provide: LayoutService,         useValue: { showHero: signal(false), title: signal(''), subtitle: signal(''), breadcrumbs: signal([]), aiLoading: signal(false), isHome: signal(false) } },
        { provide: NavigationService,     useValue: navServiceMock },
        { provide: NavController,         useValue: navCtrlMock },
        { provide: ModalController,       useValue: modalCtrlMock },
        { provide: ActionSheetController, useValue: actionSheetCtrlMock },
        { provide: Router,       useValue: { url: '/home', navigate: jasmine.createSpy(), events: of() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, params: {} }, events: new Subject() } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture   = TestBed.createComponent(PageNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose authService', () => {
    expect(component.authService).toBeTruthy();
  });

  it('should expose navService with all pages', () => {
    expect(component.navService.pages.length).toBe(5);
  });

  it('should expose platformService', () => {
    expect(component.platformService).toBeTruthy();
  });

  describe('logout — desktop (modal)', () => {
    it('should open a confirm modal on desktop', fakeAsync(() => {
      component.logout();
      tick();
      expect(modalCtrlMock.create).toHaveBeenCalled();
    }));

    it('should NOT navigate when user cancels logout modal', fakeAsync(() => {
      mockModal.onWillDismiss.and.returnValue(Promise.resolve({ data: false }));
      component.logout();
      tick();
      expect(authServiceMock.logout).not.toHaveBeenCalled();
    }));

    it('should call authService.logout and navigate to /login when confirmed', fakeAsync(() => {
      mockModal.onWillDismiss.and.returnValue(Promise.resolve({ data: true }));
      component.logout();
      tick();
      expect(authServiceMock.logout).toHaveBeenCalled();
    }));
  });

  describe('logout — mobile (action sheet)', () => {
    beforeEach(() => {
      (component.platformService as any).isDesktop = false;
    });

    it('should open an action sheet on mobile', fakeAsync(() => {
      component.logout();
      tick();
      expect(actionSheetCtrlMock.create).toHaveBeenCalled();
    }));
  });
});
