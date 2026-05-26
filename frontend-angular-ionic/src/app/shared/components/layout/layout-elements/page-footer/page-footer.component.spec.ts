import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PageFooterComponent } from './page-footer.component';
import { PlatformService } from 'src/app/core/services/system/platform.service';

function platformMock(isMobileApp: boolean) {
  return { isMobileApp, isDesktop: !isMobileApp };
}

describe('PageFooterComponent', () => {
  let component: PageFooterComponent;
  let fixture: ComponentFixture<PageFooterComponent>;

  function setup(isMobileApp: boolean) {
    TestBed.configureTestingModule({
      imports: [PageFooterComponent],
      providers: [{ provide: PlatformService, useValue: platformMock(isMobileApp) }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PageFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('when NOT a mobile app (web/desktop)', () => {
    beforeEach(waitForAsync(() => setup(false)));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render the footer element', () => {
      const footer = fixture.debugElement.query(By.css('footer.main-footer-gray'));
      expect(footer).toBeTruthy();
    });

    it('should display the copyright text with project name and author', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Fútbol Club');
      expect(text).toContain('Alex Taquila');
    });

    it('should render a LinkedIn social link', () => {
      const link = fixture.debugElement.query(By.css('a[href*="linkedin"]'));
      expect(link).toBeTruthy();
    });

    it('should render a GitHub social link', () => {
      const link = fixture.debugElement.query(By.css('a[href*="github"]'));
      expect(link).toBeTruthy();
    });

    it('social links should open in a new tab', () => {
      const links = fixture.debugElement.queryAll(By.css('a.social-icon'));
      expect(links.length).toBeGreaterThan(0);
      links.forEach(link => {
        expect(link.nativeElement.getAttribute('target')).toBe('_blank');
      });
    });

    it('should render exactly two social icon links', () => {
      const links = fixture.debugElement.queryAll(By.css('a.social-icon'));
      expect(links.length).toBe(2);
    });
  });

  describe('when running as a native mobile app', () => {
    beforeEach(waitForAsync(() => setup(true)));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should NOT render the footer element', () => {
      const footer = fixture.debugElement.query(By.css('footer.main-footer-gray'));
      expect(footer).toBeNull();
    });
  });
});
