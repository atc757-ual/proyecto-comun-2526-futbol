import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;
  let fixture: ComponentFixture<AuthLayoutComponent>;

  beforeEach(waitForAsync(() => {
    const layoutServiceMock = {
      showHero: () => false,
      breadcrumbs: () => []
    };
    const platformServiceMock = {
      isDesktop: true,
      isMobileApp: false
    };

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        AuthLayoutComponent
      ],
      providers: [
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: PlatformService, useValue: platformServiceMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the auth layout', () => {
    expect(component).toBeTruthy();
  });
});
