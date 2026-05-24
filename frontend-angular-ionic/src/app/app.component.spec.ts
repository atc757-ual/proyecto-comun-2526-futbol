import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './core/services/auth/auth.service';
import { NetworkPlugin } from './core/plugins/network-plugin';
import { of } from 'rxjs';
import { Auth } from '@angular/fire/auth';

describe('AppComponent', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: Auth, useValue: {} },
        { provide: AuthService, useValue: { user$: of(null), getUID: () => null, isAuthenticated: () => false } },
        { provide: NetworkPlugin, useValue: { getStatus: () => Promise.resolve({ connected: true }), onStatusChange: () => {} } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});
