import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlayersAllPage } from './players-all.page';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { ModalController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Player } from '../../../core/models/player.model';

const mockPlayers: Player[] = [
  { _id: 'p1', name: 'Messi', team: 'Inter Miami', league: 'MLS', nationality: 'Argentina', user_id: 'u1', position: 'Forward' },
  { _id: 'p2', name: 'Ronaldo', team: 'Al Nassr', league: 'Saudi Pro', nationality: 'Portugal', user_id: 'u2', position: 'Forward' },
  { _id: 'p3', name: 'Neymar', team: 'Al Hilal', league: 'Saudi Pro', nationality: 'Brazil', user_id: 'u1', position: 'Left Winger' }
];

const mockPlayerService = {
  getAllPlayers: jasmine.createSpy('getAllPlayers').and.returnValue(of(mockPlayers)),
  deletePlayer: jasmine.createSpy('deletePlayer').and.returnValue(of({}))
};

const mockAuthService = {
  isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
  currentUser: jasmine.createSpy('currentUser').and.returnValue({ uid: 'u1' }),
  userData: jasmine.createSpy('userData').and.returnValue({ _id: 'mongo1' })
};

const mockToastService = {
  showSuccess: jasmine.createSpy('showSuccess'),
  showError: jasmine.createSpy('showError')
};

const mockLayoutService = {
  setHeader: jasmine.createSpy('setHeader'),
  setBreadcrumbs: jasmine.createSpy('setBreadcrumbs')
};

const mockModalCtrl = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: true }))
  }))
};

describe('PlayersAllPage', () => {
  let component: PlayersAllPage;
  let fixture: ComponentFixture<PlayersAllPage>;

  beforeEach(async () => {
    mockPlayerService.getAllPlayers.calls.reset();
    mockPlayerService.deletePlayer.calls.reset();
    mockToastService.showSuccess.calls.reset();
    mockToastService.showError.calls.reset();
    mockPlayerService.getAllPlayers.and.returnValue(of(mockPlayers));
    mockPlayerService.deletePlayer.and.returnValue(of({}));
    mockModalCtrl.create.and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: true }))
    }));

    await TestBed.configureTestingModule({
      imports: [PlayersAllPage],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: mockPlayerService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersAllPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all players on init', () => {
    expect(mockPlayerService.getAllPlayers).toHaveBeenCalled();
    expect(component.totalPlayersCount()).toBe(3);
  });

  it('should configure header and breadcrumbs on init', () => {
    expect(component.pageTitle).toBe('Universo de Jugadores');
    expect(component.breadcrumbs).toBeDefined();
  });

  it('should filter players by name', () => {
    component.onSearchChange({ detail: { value: 'messi' } });
    expect(component.filteredPlayers().length).toBe(1);
    expect(component.filteredPlayers()[0].name).toBe('Messi');
  });

  it('should filter players by team', () => {
    component.onSearchChange({ detail: { value: 'al nassr' } });
    expect(component.filteredPlayers().length).toBe(1);
    expect(component.filteredPlayers()[0].name).toBe('Ronaldo');
  });

  it('should filter players by nationality', () => {
    component.onSearchChange({ detail: { value: 'brazil' } });
    expect(component.filteredPlayers().length).toBe(1);
    expect(component.filteredPlayers()[0].name).toBe('Neymar');
  });

  it('should return all players when search term is empty', () => {
    component.onSearchChange({ detail: { value: '' } });
    expect(component.filteredPlayers().length).toBe(3);
  });

  it('should clear filters and reload', () => {
    const callsBefore = mockPlayerService.getAllPlayers.calls.count();
    component.searchTerm.set('messi');
    component.onClear();
    expect(component.searchTerm()).toBe('');
    expect(mockPlayerService.getAllPlayers.calls.count()).toBe(callsBefore + 1);
  });

  it('should paginate correctly', () => {
    component.itemsPerPage.set(2);
    expect(component.totalPages()).toBe(2);
    expect(component.pagedPlayers().length).toBe(2);

    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.pagedPlayers().length).toBe(1);

    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('should not go below page 1', () => {
    component.currentPage.set(1);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('should not exceed total pages', () => {
    component.itemsPerPage.set(10);
    component.nextPage();
    expect(component.currentPage()).toBe(1); // solo 3 players, 1 page
  });

  it('should go to specific page', () => {
    component.itemsPerPage.set(1);
    component.goToPage(3);
    expect(component.currentPage()).toBe(3);
  });

  it('should not go to invalid page', () => {
    component.goToPage(0);
    expect(component.currentPage()).toBe(1);
    component.goToPage(999);
    expect(component.currentPage()).toBe(1);
  });

  it('should generate correct page list', () => {
    component.itemsPerPage.set(1);
    const pages = component.getPages();
    expect(pages).toEqual([1, 2, 3]);
  });

  it('should detect own players with isMine', () => {
    const myPlayer = mockPlayers[0]; // user_id = 'u1', currentUser().uid = 'u1'
    const otherPlayer = mockPlayers[1]; // user_id = 'u2'
    // isMine compares player.user_id with currentUser().uid OR userData()._id
    // mockAuthService.currentUser returns a signal that returns { uid: 'u1' }
    // so currentUser().uid = 'u1' matches p1.user_id = 'u1'
    expect(component.isMine(myPlayer)).toBeTrue();
    expect(component.isMine(otherPlayer)).toBeFalse();
  });

  it('should call deletePlayer after modal confirmation', fakeAsync(async () => {
    await component.deletePlayer(mockPlayers[0]);
    tick();
    expect(mockPlayerService.deletePlayer).toHaveBeenCalledWith('p1');
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  }));

  it('should show error toast if deletion fails', fakeAsync(async () => {
    mockPlayerService.deletePlayer.and.returnValue(throwError(() => new Error('fail')));
    mockModalCtrl.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve(),
      onWillDismiss: () => Promise.resolve({ data: true })
    }));
    await component.deletePlayer(mockPlayers[0]);
    tick();
    expect(mockToastService.showError).toHaveBeenCalled();
    // Restore
    mockPlayerService.deletePlayer.and.returnValue(of({}));
  }));

  it('should NOT delete if modal returns false', fakeAsync(async () => {
    mockModalCtrl.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve(),
      onWillDismiss: () => Promise.resolve({ data: false })
    }));
    const callsBefore = mockPlayerService.deletePlayer.calls.count();
    await component.deletePlayer(mockPlayers[0]);
    tick();
    expect(mockPlayerService.deletePlayer.calls.count()).toBe(callsBefore);
    // Restore
    mockModalCtrl.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve(),
      onWillDismiss: () => Promise.resolve({ data: true })
    }));
  }));

  it('should reset page to 1 on search', () => {
    component.currentPage.set(3);
    component.onSearchChange({ detail: { value: 'messi' } });
    expect(component.currentPage()).toBe(1);
  });
});
