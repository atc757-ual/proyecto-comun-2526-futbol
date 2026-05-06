import { AuthLayoutComponent } from './auth-layout.component';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

describe('AuthLayoutComponent', () => {
  it('should mount with custom title and subtitle', () => {
    cy.mount(AuthLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
      componentProperties: {
        authTitle: 'Test Title',
        authSubtitle: 'Test Subtitle',
        showBackButton: true
      }
    });

    cy.get('h1').should('contain', 'Test Title');
    cy.get('p').should('contain', 'Test Subtitle');
    cy.get('ion-back-button').should('be.visible');
  });

  it('should hide back button when showBackButton is false', () => {
    cy.mount(AuthLayoutComponent, {
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])],
      providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
      componentProperties: {
        authTitle: 'No Back Button',
        showBackButton: false
      }
    });

    cy.get('ion-back-button').should('not.be.visible');
  });
});
