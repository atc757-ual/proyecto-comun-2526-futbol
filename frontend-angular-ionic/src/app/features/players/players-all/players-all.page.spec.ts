import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlayersAllPage } from './players-all.page';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { ModalController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Player } from '../../../core/models/player.model';

const mockPlayers: Player[] = [
  { _id: 'p1', name: 'Messi',   team: 'Inter Miami', league: 'MLS',       nationality: 'Argentina', user_id: 'u1', position: 'Forward' },
  { _id: 'p2', name: 'Ronaldo', team: 'Al Nassr',    league: 'Saudi Pro', nationality: 'Portugal',  user_id: 'u2', position: 'Forward' },
  { _id: 'p3', name: 'Neymar',  team: 'Al Hilal',    league: 'Saudi Pro', nationality: 'Brazil',    user_id: 'u1', position: 'Left Winger' }
];

function makeModalCtrl(confirm: boolean) {
  return {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: confirm }))
    }))
  };
}

describe('PlayersAllPage', () => {
  let component: PlayersAllPage;
  let c: any;
  let fixture: ComponentFixture<PlayersAllPage>;
  let playerSvc: any;
  let toastSvc: any;

  async function setup(confirm = true) {
    playerSvc = {
      getAllPlayers: jasmine.createSpy('getAllPlayers').and.returnValue(of(mockPlayers)),
      deletePlayer:  jasmine.createSpy('deletePlayer').and.returnValue(of({}))
    };
    toastSvc = {
      showSuccess: jasmine.createSpy('showSuccess'),
      showError:   jasmine.createSpy('showError')
    };

    await TestBed.configureTestingModule({
      imports: [PlayersAllPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: playerSvc },
        { provide: AuthService, useValue: {
            isAdmin:     jasmine.createSpy('isAdmin').and.returnValue(false),
            currentUser: jasmine.createSpy('currentUser').and.returnValue({ uid: 'u1' }),
            userData:    jasmine.createSpy('userData').and.returnValue({ _id: 'mongo1' })
          }
        },
        { provide: ToastService,   useValue: toastSvc },
        { provide: LayoutService,  useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ModalController, useValue: makeModalCtrl(confirm) },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(PlayersAllPage);
    component = fixture.componentInstance;
    c         = component;
    fixture.detectChanges();
  }

  beforeEach(async () => setup());

  // --- Creación e inicialización ---

  it('should create', () => expect(component).toBeTruthy());

  it('should call getAllPlayers (not getPlayers) on init', () => {
    expect(playerSvc.getAllPlayers).toHaveBeenCalled();
    expect(c.totalPlayersCount()).toBe(3);
  });

  it('should expose the correct page title', () => {
    expect(component.pageTitle).toBe('Universo de Jugadores');
  });

  // --- Búsqueda (comportamiento heredado, comprobación mínima) ---

  it('should filter by name', () => {
    component.onSearchChange({ detail: { value: 'messi' } });
    expect(c.filteredPlayers().length).toBe(1);
    expect(c.filteredPlayers()[0].name).toBe('Messi');
  });

  it('should filter by nationality', () => {
    component.onSearchChange({ detail: { value: 'brazil' } });
    expect(c.filteredPlayers().length).toBe(1);
    expect(c.filteredPlayers()[0].name).toBe('Neymar');
  });

  it('onClear should reset search and reload', () => {
    const before = playerSvc.getAllPlayers.calls.count();
    c.searchTerm.set('messi');
    component.onClear();
    expect(c.searchTerm()).toBe('');
    expect(playerSvc.getAllPlayers.calls.count()).toBe(before + 1);
  });

  // --- isMine (exclusivo de PlayersAllPage) ---

  it('isMine should return true for own player (uid match)', () => {
    expect(component.isMine(mockPlayers[0])).toBeTrue();   // user_id='u1', uid='u1'
  });

  it('isMine should return false for other player', () => {
    expect(component.isMine(mockPlayers[1])).toBeFalse();  // user_id='u2'
  });

  it('isMine should return false when player has no user_id', () => {
    expect(component.isMine({ _id: 'x', name: 'Ghost', position: 'DEL', team: 'FC', user_id: '' })).toBeFalse();
  });

  // --- Eliminación ---

  it('should delete player after modal confirmation', fakeAsync(async () => {
    await component.deletePlayer(mockPlayers[0]);
    tick();
    expect(playerSvc.deletePlayer).toHaveBeenCalledWith('p1');
    expect(toastSvc.showSuccess).toHaveBeenCalled();
  }));

  it('should show error toast if deletion fails', fakeAsync(async () => {
    playerSvc.deletePlayer.and.returnValue(throwError(() => new Error('fail')));
    await component.deletePlayer(mockPlayers[0]);
    tick();
    expect(toastSvc.showError).toHaveBeenCalled();
  }));

});

describe('PlayersAllPage — modal cancelado', () => {
  let component: PlayersAllPage;
  let playerSvc: any;
  let toastSvc: any;

  beforeEach(async () => {
    playerSvc = {
      getAllPlayers: jasmine.createSpy('getAllPlayers').and.returnValue(of(mockPlayers)),
      deletePlayer:  jasmine.createSpy('deletePlayer').and.returnValue(of({}))
    };
    toastSvc = { showSuccess: jasmine.createSpy(), showError: jasmine.createSpy() };

    await TestBed.configureTestingModule({
      imports: [PlayersAllPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: playerSvc },
        { provide: AuthService, useValue: {
            isAdmin: () => false, currentUser: () => ({ uid: 'u1' }), userData: () => ({})
          }
        },
        { provide: ToastService,   useValue: toastSvc },
        { provide: LayoutService,  useValue: { setHeader: () => {}, setBreadcrumbs: () => {} } },
        { provide: ModalController, useValue: makeModalCtrl(false) },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PlayersAllPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should NOT delete when modal is cancelled', fakeAsync(async () => {
    await component.deletePlayer(mockPlayers[0]);
    tick();
    expect(playerSvc.deletePlayer).not.toHaveBeenCalled();
  }));
});
