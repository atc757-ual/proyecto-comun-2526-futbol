import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LayoutNavigationComponent } from './layout-navigation.component';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { of, Subject } from 'rxjs';

describe('LayoutNavigationComponent', () => {
  let component: LayoutNavigationComponent;
  let fixture: ComponentFixture<LayoutNavigationComponent>;

  const authServiceMock = {
    userData: signal<any>(null),
    currentUser: signal<any>(null),
    firstName: signal(''),
    isLoggedIn$: of(false),
    isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
    isMasterAdmin: jasmine.createSpy('isMasterAdmin').and.returnValue(false),
    logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve()),
  };

  const platformServiceMock = {
    isMobileApp: false,
    isDesktop: true,
    getUseJavaBackend: jasmine.createSpy('getUseJavaBackend').and.returnValue(false),
  };

  const layoutServiceMock = {
    showHero: signal(false),
    title: signal(''),
    subtitle: signal(''),
    breadcrumbs: signal([]),
    aiLoading: signal(false),
    isHome: signal(false),
  };

  const routerMock = {
    url: '/home',
    navigate: jasmine.createSpy('navigate'),
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/home'),
    events: of(),
  };

  const activatedRouteMock = {
    snapshot: { queryParams: {}, params: {}, outlet: 'primary' },
    events: new Subject(),
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LayoutNavigationComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isTabActive should return true for matching route', () => {
    expect(component.isTabActive('/home')).toBeTrue();
  });

  it('isRootPage should return true for /home', () => {
    expect(component.isRootPage).toBeTrue();
  });
});
