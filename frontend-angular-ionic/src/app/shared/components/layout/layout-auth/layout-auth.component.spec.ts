import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LayoutAuthComponent } from './layout-auth.component';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';

function buildMocks(options: {
  isLogin?: boolean;
  isMobileApp?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { isLogin = false, isMobileApp = false, title = 'Bienvenido', subtitle = 'Accede a tu cuenta' } = options;
  return {
    layout: {
      isLogin: jasmine.createSpy('isLogin').and.returnValue(isLogin),
      authTitle: jasmine.createSpy('authTitle').and.returnValue(title),
      authSubtitle: jasmine.createSpy('authSubtitle').and.returnValue(subtitle)
    },
    platform: { isMobileApp, isDesktop: !isMobileApp }
  };
}

async function createFixture(options: Parameters<typeof buildMocks>[0]) {
  const mocks = buildMocks(options);
  await TestBed.configureTestingModule({
    imports: [LayoutAuthComponent, IonicModule.forRoot(), RouterTestingModule],
    providers: [
      { provide: LayoutService, useValue: mocks.layout },
      { provide: PlatformService, useValue: mocks.platform }
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
  }).compileComponents();

  const fixture = TestBed.createComponent(LayoutAuthComponent);
  fixture.detectChanges();
  return fixture;
}

describe('LayoutAuthComponent', () => {
  let component: LayoutAuthComponent;
  let fixture: ComponentFixture<LayoutAuthComponent>;

  describe('creation and service injection', () => {
    beforeEach(waitForAsync(async () => {
      fixture = await createFixture({});
      component = fixture.componentInstance;
    }));

    it('should create the auth layout', () => {
      expect(component).toBeTruthy();
    });

    it('should expose layoutService', () => {
      expect(component.layoutService).toBeTruthy();
    });

    it('should expose platformService', () => {
      expect(component.platformService).toBeTruthy();
    });
  });

  describe('back link visibility', () => {
    it('should show the back link when NOT on the login page', waitForAsync(async () => {
      fixture = await createFixture({ isLogin: false });
      const backLink = fixture.debugElement.query(By.css('.back-link-minimal'));
      expect(backLink).toBeTruthy();
    }));

    it('should hide the back link when on the login page', waitForAsync(async () => {
      fixture = await createFixture({ isLogin: true });
      const backLink = fixture.debugElement.query(By.css('.back-link-minimal'));
      expect(backLink).toBeNull();
    }));

    it('back link should point to /auth/login', waitForAsync(async () => {
      fixture = await createFixture({ isLogin: false });
      const backLink = fixture.debugElement.query(By.css('.back-link-minimal'));
      expect(backLink.nativeElement.getAttribute('ng-reflect-router-link')).toBe('/auth/login');
    }));
  });

  describe('dynamic text content', () => {
    beforeEach(waitForAsync(async () => {
      fixture = await createFixture({ title: 'Regístrate', subtitle: 'Crea tu cuenta gratis' });
      component = fixture.componentInstance;
    }));

    it('should display the title from layoutService.authTitle()', () => {
      const h2 = fixture.debugElement.query(By.css('h2.f-bold.text-neutral-9'));
      expect(h2.nativeElement.textContent.trim()).toBe('Regístrate');
    });

    it('should display the subtitle from layoutService.authSubtitle()', () => {
      const span = fixture.debugElement.query(By.css('span.f-medium.text-neutral-7'));
      expect(span.nativeElement.textContent.trim()).toBe('Crea tu cuenta gratis');
    });
  });

  describe('footer visibility', () => {
    it('should render app-page-footer on web/desktop', waitForAsync(async () => {
      fixture = await createFixture({ isMobileApp: false });
      const footer = fixture.debugElement.query(By.css('app-page-footer'));
      expect(footer).toBeTruthy();
    }));

    it('should NOT render app-page-footer on native mobile app', waitForAsync(async () => {
      fixture = await createFixture({ isMobileApp: true });
      const footer = fixture.debugElement.query(By.css('app-page-footer'));
      expect(footer).toBeNull();
    }));

    it('should render the in-layout mobile footer only on native app', waitForAsync(async () => {
      fixture = await createFixture({ isMobileApp: true });
      const mobileFooter = fixture.debugElement.query(By.css('footer.auth-global-footer'));
      expect(mobileFooter).toBeTruthy();
    }));

    it('should NOT render the in-layout mobile footer on web', waitForAsync(async () => {
      fixture = await createFixture({ isMobileApp: false });
      const mobileFooter = fixture.debugElement.query(By.css('footer.auth-global-footer'));
      expect(mobileFooter).toBeNull();
    }));
  });
});
