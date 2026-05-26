import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let mockRouter: { navigate: jasmine.Spy; url: string };

  beforeEach(() => {
    mockRouter = { navigate: jasmine.createSpy('navigate'), url: '/home' };
    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: { back: jasmine.createSpy() } },
      ]
    });
    service = TestBed.inject(NavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('pages should contain 5 navigation items', () => {
    expect(service.pages.length).toBe(5);
  });

  it('isTabActive() should return true for /home when on /home', () => {
    mockRouter.url = '/home';
    expect(service.isTabActive('/home')).toBeTrue();
  });

  it('isTabActive() should return false for /home when on /players', () => {
    mockRouter.url = '/players';
    expect(service.isTabActive('/home')).toBeFalse();
  });

  it('isTabActive() should return true for /players when url includes player', () => {
    mockRouter.url = '/players/list';
    expect(service.isTabActive('/players')).toBeTrue();
  });

  it('isTabActive() should return false for /players when url includes public', () => {
    mockRouter.url = '/player-detail-public/123';
    expect(service.isTabActive('/players')).toBeFalse();
  });

  it('isCurrentHome() should return true when on /home', () => {
    mockRouter.url = '/home';
    expect(service.isCurrentHome()).toBeTrue();
  });

  it('isCurrentHome() should return false when not on /home', () => {
    mockRouter.url = '/players';
    expect(service.isCurrentHome()).toBeFalse();
  });
});
