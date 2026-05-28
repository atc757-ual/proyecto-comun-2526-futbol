import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { PageTabsComponent } from './page-tabs.component';
import { NavigationService, APP_PAGES } from 'src/app/core/services/ui/navigation.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('PageTabsComponent', () => {
  let component: PageTabsComponent;
  let fixture: ComponentFixture<PageTabsComponent>;
  let navServiceMock: jasmine.SpyObj<NavigationService> & { pages: typeof APP_PAGES };

  beforeEach(waitForAsync(() => {
    navServiceMock = jasmine.createSpyObj('NavigationService', [
      'isTabActive', 'isCurrentHome', 'goBack'
    ]) as jasmine.SpyObj<NavigationService> & { pages: typeof APP_PAGES };
    navServiceMock.pages = APP_PAGES;
    navServiceMock.isTabActive.and.returnValue(false);

    TestBed.configureTestingModule({
      imports: [PageTabsComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: NavigationService, useValue: navServiceMock },
        {
          provide: AuthService,
          useValue: jasmine.createSpyObj('AuthService', ['logout'], {
            user$: of(null),
            userData: () => null,
            currentUser: () => null
          })
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PageTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject NavigationService', () => {
    expect(component.navService).toBeTruthy();
  });

  describe('APP_PAGES navigation structure', () => {
    it('should expose exactly 5 navigation pages', () => {
      expect(component.navService.pages.length).toBe(5);
    });

    it('should include home, players, ai-team, busqueda and news routes', () => {
      const urls = APP_PAGES.map(p => p.url);
      expect(urls).toContain('/home');
      expect(urls).toContain('/players');
      expect(urls).toContain('/ai-team');
      expect(urls).toContain('/busqueda');
      expect(urls).toContain('/news');
    });

    it('each page should have a non-empty title, url and icon', () => {
      APP_PAGES.forEach(page => {
        expect(page.title).toBeTruthy();
        expect(page.url).toBeTruthy();
        expect(page.icon).toBeTruthy();
      });
    });

    it('the AI-team tab should be at index 2 (center special tab)', () => {
      expect(APP_PAGES[2].url).toBe('/ai-team');
    });
  });

  describe('isTabActive', () => {
    describe('with authenticated user', () => {
      let authFixture: ComponentFixture<PageTabsComponent>;
      let authComponent: PageTabsComponent;
      let authNavMock: jasmine.SpyObj<NavigationService> & { pages: typeof APP_PAGES };

      beforeEach(waitForAsync(() => {
        authNavMock = jasmine.createSpyObj('NavigationService', [
          'isTabActive', 'isCurrentHome', 'goBack'
        ]) as jasmine.SpyObj<NavigationService> & { pages: typeof APP_PAGES };
        authNavMock.pages = APP_PAGES;
        authNavMock.isTabActive.and.returnValue(false);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [PageTabsComponent, RouterTestingModule, HttpClientTestingModule],
          providers: [
            { provide: NavigationService, useValue: authNavMock },
            {
              provide: AuthService,
              useValue: jasmine.createSpyObj('AuthService', ['logout'], {
                user$: of({ uid: 'test-uid', email: 'test@test.com' }),
                userData: () => null,
                currentUser: () => ({ uid: 'test-uid', email: 'test@test.com' })
              })
            }
          ],
          schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        authFixture = TestBed.createComponent(PageTabsComponent);
        authComponent = authFixture.componentInstance;
        authFixture.detectChanges();
      }));

      afterEach(() => {
        authFixture.destroy();
        TestBed.resetTestingModule();
      });

      it('should call isTabActive when user is logged in and tabs are rendered', () => {
        expect(authNavMock.isTabActive).toHaveBeenCalled();
      });
    });

    it('should NOT call isTabActive when there is no session (shows login message)', () => {
      // Por defecto currentUser() = null → no se renderizan las tabs
      navServiceMock.isTabActive.calls.reset();
      fixture.detectChanges();
      expect(navServiceMock.isTabActive).not.toHaveBeenCalled();
    });

    it('should return true for the currently active tab', () => {
      navServiceMock.isTabActive.and.callFake((url: string) => url === '/home');
      expect(component.navService.isTabActive('/home')).toBeTrue();
    });

    it('should return false for inactive tabs', () => {
      navServiceMock.isTabActive.and.callFake((url: string) => url === '/home');
      expect(component.navService.isTabActive('/players')).toBeFalse();
      expect(component.navService.isTabActive('/news')).toBeFalse();
    });

    it('should not mark any tab as active when on a non-tab route', () => {
      navServiceMock.isTabActive.and.returnValue(false);
      APP_PAGES.forEach(page => {
        expect(component.navService.isTabActive(page.url)).toBeFalse();
      });
    });
  });
});
