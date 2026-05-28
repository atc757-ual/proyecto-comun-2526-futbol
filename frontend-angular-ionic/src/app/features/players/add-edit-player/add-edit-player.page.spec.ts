import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditPlayerPage } from './add-edit-player.page';
import { PLAYER_SERVICE_TOKEN } from '@core/services/players/player.service.token';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastService } from '@core/services/ui/toast.service';
import { LayoutService } from '@core/services/ui/layout.service';
import { ConfettiService } from '@core/services/ui/confetti.service';
import { CameraPlugin } from '@core/plugins/camera-plugin';
import { LocationPlugin } from '@core/plugins/location-plugin';
import { MapPlugin } from '@core/plugins/maps-plugin';
import {
  NavController, LoadingController, ModalController, AlertController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DomSanitizer } from '@angular/platform-browser';

const mockPlayerService = {
  getPlayer: jasmine.createSpy('getPlayer').and.returnValue(of({
    _id: 'p1', name: 'Messi', team: 'Inter Miami', league: 'MLS',
    social_media: {}, images: {}, tsdb_ids: {}
  })),
  savePlayer: jasmine.createSpy('savePlayer').and.returnValue(of({ _id: 'p1' })),
  getPlayers: jasmine.createSpy('getPlayers').and.returnValue(of([])),
  searchTSDBPlayers: jasmine.createSpy('searchTSDBPlayers').and.returnValue(of([])),
  lookupTSDBPlayer: jasmine.createSpy('lookupTSDBPlayer').and.returnValue(of(null)),
  lookupTSDBLeague: jasmine.createSpy('lookupTSDBLeague').and.returnValue(of(null)),
  bulkImportPlayers: jasmine.createSpy('bulkImportPlayers').and.returnValue(of({ count: 1 })),
  reverseGeocode: jasmine.createSpy('reverseGeocode').and.returnValue(of('Madrid, España')),
  mapTSDBToPlayer: jasmine.createSpy('mapTSDBToPlayer').and.returnValue({})
};

const user$ = new Subject<any>();
const mockAuthService = {
  user$,
  isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
  currentUser: jasmine.createSpy('currentUser').and.returnValue(signal({ uid: 'u1' })),
  getUID: jasmine.createSpy('getUID').and.returnValue('u1'),
  userData: jasmine.createSpy('userData').and.returnValue(signal({}))
};

const mockToastService = {
  showSuccess: jasmine.createSpy('showSuccess'),
  showError: jasmine.createSpy('showError'),
  showWarning: jasmine.createSpy('showWarning').and.returnValue(Promise.resolve())
};

const mockLayoutService = {
  setHeader: jasmine.createSpy('setHeader'),
  setBreadcrumbs: jasmine.createSpy('setBreadcrumbs')
};

const mockNavCtrl = {
  back: jasmine.createSpy('back'),
  navigateRoot: jasmine.createSpy('navigateRoot')
};

const mockRouter = {
  navigate: jasmine.createSpy('navigate')
};

const mockModalCtrl = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: null }))
  }))
};

const mockLoadingCtrl = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
  }))
};

const mockLocationPlugin = {
  isGeolocationPermissionGranted: jasmine.createSpy().and.returnValue(Promise.resolve(false)),
  requestGeolocationPermission: jasmine.createSpy().and.returnValue(Promise.resolve(false)),
  getCurrentPosition: jasmine.createSpy().and.returnValue(Promise.resolve({
    coords: { latitude: 40.4168, longitude: -3.7038 }
  }))
};

const mockCameraPlugin = {
  isCameraPermissionGranted: jasmine.createSpy().and.returnValue(Promise.resolve(false)),
  requestCameraPermission: jasmine.createSpy().and.returnValue(Promise.resolve(false)),
  takePhoto: jasmine.createSpy().and.returnValue(Promise.resolve(null))
};

const mockMapPlugin = {
  initMap: jasmine.createSpy('initMap').and.returnValue({ invalidateSize: () => {} }),
  addMarker: jasmine.createSpy('addMarker').and.returnValue({ on: () => {} }),
  destroyMap: jasmine.createSpy('destroyMap')
};

const mockConfettiService = {
  celebrate: jasmine.createSpy('celebrate')
};

describe('AddEditPlayerPage', () => {
  let component: AddEditPlayerPage;
  let fixture: ComponentFixture<AddEditPlayerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditPlayerPage, HttpClientTestingModule],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: mockPlayerService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: Router, useValue: mockRouter },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: LoadingController, useValue: mockLoadingCtrl },
        { provide: AlertController, useValue: {} },
        { provide: LocationPlugin, useValue: mockLocationPlugin },
        { provide: CameraPlugin, useValue: mockCameraPlugin },
        { provide: MapPlugin, useValue: mockMapPlugin },
        { provide: ConfettiService, useValue: mockConfettiService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: DomSanitizer, useValue: { bypassSecurityTrustResourceUrl: (url: string) => url } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditPlayerPage);
    component = fixture.componentInstance;
    mockPlayerService.savePlayer.calls.reset();
    mockToastService.showError.calls.reset();
    mockToastService.showSuccess.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in import mode for new player', () => {
    expect(component.entryMode).toBe('import');
    expect(component.isEditMode).toBeFalse();
  });

  it('should compute importButtonLabel correctly', () => {
    expect(component.importButtonLabel).toBe('Seleccionar jugadores');

    component.selectedApiPlayers = [{ externalId: '1', name: 'A' }];
    expect(component.importButtonLabel).toBe('Cargar jugador');

    component.selectedApiPlayers = [{ externalId: '1', name: 'A' }, { externalId: '2', name: 'B' }];
    expect(component.importButtonLabel).toBe('Cargar 2 jugadores');
  });

  it('should detect import mode', () => {
    component.entryMode = 'import';
    expect(component.isImportMode()).toBeTrue();
    expect(component.isManualMode()).toBeFalse();
  });

  it('should detect manual mode', () => {
    component.entryMode = 'manual';
    expect(component.isManualMode()).toBeTrue();
    expect(component.isImportMode()).toBeFalse();
  });

  it('should calculate age from birth date', () => {
    component.player.birth_date = '2000-01-01';
    component.calculateAge();
    expect(component.player.age).toBeGreaterThan(20);
  });

  it('should validate required fields on save', async () => {
    component.player.name = '';
    component.player.team = '';
    await component.onSave();
    expect(mockToastService.showError).toHaveBeenCalled();
    expect(mockPlayerService.savePlayer).not.toHaveBeenCalled();
  });

  it('should save player successfully', fakeAsync(async () => {
    component.player.name = 'Messi';
    component.player.team = 'Inter Miami';
    component.player.location = { type: 'Point', coordinates: [-3.7038, 40.4168] };
    component.isPublishing = false;
    await component.onSave();
    tick(1000);
    expect(mockPlayerService.savePlayer).toHaveBeenCalled();
    expect(mockConfettiService.celebrate).toHaveBeenCalled();
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  }));

  it('should show error on save failure', fakeAsync(async () => {
    mockPlayerService.savePlayer.and.returnValue(throwError(() => new Error('fail')));
    component.player.name = 'Messi';
    component.player.team = 'Inter Miami';
    component.player.location = { type: 'Point', coordinates: [-3.7038, 40.4168] };
    await component.onSave();
    tick();
    expect(mockToastService.showError).toHaveBeenCalled();
    // Restore
    mockPlayerService.savePlayer.and.returnValue(of({ _id: 'p1' }));
  }));

  it('should paginate API results', () => {
    component.apiResults = Array.from({ length: 25 }, (_, i) => ({ name: `Player ${i}` }));
    expect(component.pagedResults.length).toBe(11);
    expect(component.totalPages).toBe(3);
    component.nextPage();
    expect(component.currentPage).toBe(2);
    component.prevPage();
    expect(component.currentPage).toBe(1);
  });

  it('should toggle entry mode and reset search state', () => {
    component.apiSearchQuery = 'Messi';
    component.apiResults = [{ name: 'A' }];
    component.segmentChanged({ detail: { value: 'manual' } });
    expect(component.entryMode).toBe('manual');
    expect(component.apiSearchQuery).toBe('');
    expect(component.apiResults).toEqual([]);
  });

  it('should clear search', () => {
    component.apiSearchQuery = 'test';
    component.apiResults = [{ name: 'X' }];
    component.clearSearch();
    expect(component.apiSearchQuery).toBe('');
    expect(component.apiResults).toEqual([]);
    expect(component.hasSearchedApi).toBeFalse();
  });

  it('should set focus and mark fields as touched', () => {
    component.setFocus('name');
    expect(component.nameTouched).toBeTrue();
    component.setFocus('team');
    expect(component.teamTouched).toBeTrue();
  });

  it('should capitalize player name on blur', () => {
    component.player.name = 'leo messi';
    component.onBlurName();
    expect(component.player.name).toBe('Leo Messi');
  });

  it('should detect if player is already in staff', () => {
    component.localPlayers = [{ _id: 'x', name: 'A', external_id: '999' } as any];
    expect(component.isInStaff('999')).toBeTrue();
    expect(component.isInStaff('000')).toBeFalse();
  });

  it('should sync previews from player images', () => {
    component.player.image_url = 'https://img.png';
    component.syncPreviews();
    expect(component.previews['image_url']).toBe('https://img.png');
  });

  it('should check if player has any image', () => {
    component.player.image_url = '';
    expect(component.hasAnyImage()).toBeFalse();
    component.player.image_url = 'https://img.png';
    expect(component.hasAnyImage()).toBeTrue();
  });

  it('should get and update player image by key', () => {
    component.player.image_url = '';
    component.updatePlayerImage('image_url', 'https://test.png');
    expect(component.getPlayerImage('image_url')).toBe('https://test.png');
  });

  it('should detect selected API players', () => {
    const p = { externalId: 'ext1', name: 'A' };
    expect(component.isSelected(p)).toBeFalse();
    component.selectedApiPlayers = [p];
    expect(component.isSelected(p)).toBeTrue();
  });

  it('should clear all images', () => {
    component.player.image_url = 'https://img.png';
    component.clearAllImages();
    expect(component.player.image_url).toBe('');
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  });

  it('ngOnDestroy should call mapPlugin destroyMap', () => {
    component.ngOnDestroy();
    expect(mockMapPlugin.destroyMap).toHaveBeenCalled();
  });
});

afterEach(() => {
  TestBed.resetTestingModule();
});
