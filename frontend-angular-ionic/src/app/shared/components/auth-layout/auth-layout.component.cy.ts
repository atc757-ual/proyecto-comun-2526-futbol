import { AuthLayoutComponent } from './auth-layout.component';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';

describe('AuthLayoutComponent', () => {
  it('should mount with service title and subtitle', () => {
    cy.mount(AuthLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        {
          provide: LayoutService,
          useValue: {
            isLogin: () => false,
            authTitle: () => 'Test Title',
            authSubtitle: () => 'Test Subtitle'
          }
        },
        { provide: PlatformService, useValue: { isMobileApp: false } }
      ]
    });

    cy.get('h2').should('contain', 'Test Title');
    cy.get('span').contains('Test Subtitle').should('exist');
    cy.get('ion-back-button').should('exist');
  });

  it('should hide back button on login state', () => {
    cy.mount(AuthLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        {
          provide: LayoutService,
          useValue: {
            isLogin: () => true,
            authTitle: () => 'No Back Button',
            authSubtitle: () => ''
          }
        },
        { provide: PlatformService, useValue: { isMobileApp: false } }
      ]
    });

    cy.get('ion-back-button').should('not.exist');
  });
});
