import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlayerDetailPage } from './player-detail.page';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { ConfettiService } from '../../../core/services/ui/confetti.service';
import { LocationPlugin } from '../../../core/plugins/location-plugin';
import { MapPlugin } from '../../../core/plugins/maps-plugin';
import { ShareCardPlugin } from '../../../core/plugins/share-card-plugin';
import { HapticsPlugin } from '../../../core/plugins/haptics-plugin';
import { ModalController, LoadingController, NavController, AlertController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Player } from '../../../core/models/player.model';

const mockPlayer: Player = {
  _id: 'abc123',
  name: 'Leo Messi',
  team: 'Inter Miami',
  league: 'MLS',
  position: 'Forward',
  nationality: 'Argentina',
  user_id: 'user-uid-1',
  isFavorite: false,
  comments: []
};

const playerServiceMock = {
  getPlayer: jasmine.createSpy('getPlayer').and.returnValue(of(mockPlayer)),
  deletePlayer: jasmine.createSpy('deletePlayer').and.returnValue(of({})),
  toggleFavorite: jasmine.createSpy('toggleFavorite').and.returnValue(of(mockPlayer)),
  addComment: jasmine.createSpy('addComment').and.returnValue(of({})),
  updateComment: jasmine.createSpy('updateComment').and.returnValue(of({})),
  deleteComment: jasmine.createSpy('deleteComment').and.returnValue(of({})),
  reverseGeocode: jasmine.createSpy('reverseGeocode').and.returnValue(of('Madrid, España')),
  getPlayerTeamsHistory: jasmine.createSpy().and.returnValue(of([])),
  getPlayerHonours: jasmine.createSpy().and.returnValue(of([])),
  getPlayerMilestones: jasmine.createSpy().and.returnValue(of([])),
  lookupTSDBTeam: jasmine.createSpy().and.returnValue(of(null)),
  lookupTSDBLeague: jasmine.createSpy().and.returnValue(of(null))
};

const authServiceMock = {
  isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
  currentUser: jasmine.createSpy('currentUser').and.returnValue(signal({ uid: 'user-uid-1', displayName: 'Test User' })),
  getUID: jasmine.createSpy('getUID').and.returnValue('user-uid-1'),
  userData: jasmine.createSpy('userData').and.returnValue(signal({}))
};

const toastServiceMock = {
  showSuccess: jasmine.createSpy('showSuccess'),
  showError: jasmine.createSpy('showError')
};

const layoutServiceMock = {
  setHeader: jasmine.createSpy('setHeader'),
  setBreadcrumbs: jasmine.createSpy('setBreadcrumbs')
};

const modalCtrlMock = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: true }))
  }))
};

const navCtrlMock = {
  navigateRoot: jasmine.createSpy('navigateRoot'),
  back: jasmine.createSpy('back')
};

describe('PlayerDetailPage', () => {
  let component: PlayerDetailPage;
  let fixture: ComponentFixture<PlayerDetailPage>;

  beforeEach(async () => {
    // Reset spies before each test
    playerServiceMock.getPlayer.calls.reset();
    playerServiceMock.toggleFavorite.calls.reset();
    playerServiceMock.addComment.calls.reset();
    playerServiceMock.deleteComment.calls.reset();
    playerServiceMock.updateComment.calls.reset();
    playerServiceMock.getPlayer.and.returnValue(of({ ...mockPlayer }));
    playerServiceMock.toggleFavorite.and.returnValue(of({ ...mockPlayer }));
    toastServiceMock.showSuccess.calls.reset();
    toastServiceMock.showError.calls.reset();

    await TestBed.configureTestingModule({
      imports: [PlayerDetailPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: playerServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: LayoutService, useValue: layoutServiceMock },
        { provide: ModalController, useValue: modalCtrlMock },
        { provide: NavController, useValue: navCtrlMock },
        { provide: AlertController, useValue: {} },
        { provide: LoadingController, useValue: { create: jasmine.createSpy().and.returnValue(Promise.resolve({ present: () => {}, dismiss: () => {} })) } },
        { provide: ConfettiService, useValue: { goldCelebrate: jasmine.createSpy() } },
        { provide: LocationPlugin, useValue: { isGeolocationPermissionGranted: jasmine.createSpy().and.returnValue(Promise.resolve(false)), requestGeolocationPermission: jasmine.createSpy().and.returnValue(Promise.resolve(false)) } },
        { provide: MapPlugin, useValue: { initMap: jasmine.createSpy(), addMarker: jasmine.createSpy(), destroyMap: jasmine.createSpy() } },
        { provide: ShareCardPlugin, useValue: { shareElementAsImage: jasmine.createSpy().and.returnValue(Promise.resolve(true)) } },
        { provide: HapticsPlugin, useValue: { impact: jasmine.createSpy(), notification: jasmine.createSpy() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDetailPage);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load player data on id setter', fakeAsync(() => {
    component.id = 'abc123';
    tick(1000);
    expect(playerServiceMock.getPlayer).toHaveBeenCalledWith('abc123');
    expect(component.player).toEqual(mockPlayer);
  }));

  it('should detect isOwner correctly', fakeAsync(() => {
    component.id = 'abc123';
    tick(1000);
    expect(component.isOwner).toBeTrue();
  }));

  it('should toggle favorite optimistically', fakeAsync(() => {
    component.id = 'abc123';
    tick(1000);
    component.toggleFavorite();
    tick();
    expect(playerServiceMock.toggleFavorite).toHaveBeenCalledWith('abc123', true);
    expect(toastServiceMock.showSuccess).toHaveBeenCalled();
  }));

  it('should restore favorite on error', fakeAsync(() => {
    playerServiceMock.toggleFavorite.and.returnValue(throwError(() => new Error('fail')));
    component.id = 'abc123';
    tick(1000);
    // After load, isFavorite is false (from mockPlayer)
    expect(component.player?.isFavorite).toBeFalse();
    component.toggleFavorite();
    tick();
    // After error, should be restored to original false (optimistic was true, rollback to false)
    expect(component.player?.isFavorite).toBeFalse();
    expect(toastServiceMock.showError).toHaveBeenCalled();
    // Restore spy
    playerServiceMock.toggleFavorite.and.returnValue(of({ ...mockPlayer }));
  }));

  it('should submit comment and reload', fakeAsync(() => {
    component.id = 'abc123';
    tick(1000);
    component.newComment = 'Gran jugador';
    component.newRating = 4;
    component.submitComment();
    tick();
    expect(playerServiceMock.addComment).toHaveBeenCalled();
    expect(toastServiceMock.showSuccess).toHaveBeenCalled();
  }));

  it('should set rating in edit mode', () => {
    component.setRating(3, true);
    expect(component.editingRating).toBe(3);
  });

  it('should set rating in new mode', () => {
    component.setRating(5, false);
    expect(component.newRating).toBe(5);
  });

  it('should calculate totalPages correctly', fakeAsync(() => {
    component.id = 'abc123';
    tick(1000);
    // mockPlayer.comments = [] → 0 pages
    expect(component.totalPages()).toBe(0);
  }));

  it('should toggle card view', () => {
    expect(component.showCutout).toBeFalse();
    component.toggleCardView();
    expect(component.showCutout).toBeTrue();
  });

  it('should generate correct rating stars array', () => {
    const stars = component.getRatingStars(3);
    expect(stars).toEqual(['star', 'star', 'star', 'star-outline', 'star-outline']);
  });

  it('should format safe image URL with proxy', () => {
    const url = 'https://thesportsdb.com/player.jpg';
    const safeUrl = component.getSafeImageUrl(url);
    expect(safeUrl).toContain('weserv');
  });

  it('should return placeholder for undefined image URL', () => {
    expect(component.getSafeImageUrl(undefined)).toBe('assets/img/placeholder.jpg');
  });

  it('ngOnInit should configure header and check permissions', async () => {
    await component.ngOnInit();
    expect(component.pageTitle).toBeDefined();
    expect(component.isAdmin).toBeFalse();
  });
});
