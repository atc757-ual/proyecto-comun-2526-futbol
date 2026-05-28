import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick, flush } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { BusquedaListPage } from './busqueda-list.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LocationPlugin } from '../../../core/plugins/location-plugin';
import { MapPlugin } from '../../../core/plugins/maps-plugin';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ConfettiService } from '../../../core/services/ui/confetti.service';

const mockPlayerService = {
  searchTSDBLeagues: jasmine.createSpy('searchTSDBLeagues').and.returnValue(of([])),
  searchTSDBTeams: jasmine.createSpy('searchTSDBTeams').and.returnValue(of([])),
  searchTSDBPlayers: jasmine.createSpy('searchTSDBPlayers').and.returnValue(of([])),
  getTeamsByLeague: jasmine.createSpy('getTeamsByLeague').and.returnValue(of([])),
  getTSDBPlayersByTeam: jasmine.createSpy('getTSDBPlayersByTeam').and.returnValue(of([])),
  lookupTSDBPlayer: jasmine.createSpy('lookupTSDBPlayer').and.returnValue(of(null)),
  mapTSDBToPlayer: jasmine.createSpy('mapTSDBToPlayer').and.returnValue({}),
  addPlayer: jasmine.createSpy('addPlayer').and.returnValue(of({})),
  getPlayers: jasmine.createSpy('getPlayers').and.returnValue(of([])),
  reverseGeocode: jasmine.createSpy('reverseGeocode').and.returnValue(of('Madrid, España')),
};

const mockLocationPlugin = {
  getCurrentPosition: jasmine.createSpy('getCurrentPosition').and.returnValue(
    Promise.resolve({ coords: { latitude: 40.4168, longitude: -3.7038 } })
  ),
  isGeolocationPermissionGranted: jasmine.createSpy('isGeolocationPermissionGranted').and.returnValue(
    Promise.resolve(false)
  ),
};

const mockMapPlugin = {
  initMap: jasmine.createSpy('initMap').and.returnValue({
    invalidateSize: () => { },
    _container: true
  }),
  addMarker: jasmine.createSpy('addMarker').and.returnValue({
    on: () => { }
  }),
};

const mockToastService = {
  showSuccess: jasmine.createSpy('showSuccess'),
  showError: jasmine.createSpy('showError'),
  showWarning: jasmine.createSpy('showWarning').and.returnValue(Promise.resolve()),
};

const mockConfettiService = {
  goldCelebrate: jasmine.createSpy('goldCelebrate'),
};

describe('BusquedaListPage', () => {
  let component: BusquedaListPage;
  let fixture: ComponentFixture<BusquedaListPage>;

  beforeEach(waitForAsync(() => {
    // Reset all spies before each test
    Object.values(mockPlayerService).forEach(spy => (spy as jasmine.Spy).calls?.reset?.());
    mockPlayerService.searchTSDBLeagues.and.returnValue(of([]));
    mockPlayerService.searchTSDBTeams.and.returnValue(of([]));
    mockPlayerService.searchTSDBPlayers.and.returnValue(of([]));
    mockPlayerService.getTeamsByLeague.and.returnValue(of([]));
    mockPlayerService.getTSDBPlayersByTeam.and.returnValue(of([]));
    mockPlayerService.getPlayers.and.returnValue(of([]));
    mockPlayerService.reverseGeocode.and.returnValue(of('Madrid, España'));
    mockLocationPlugin.isGeolocationPermissionGranted.and.returnValue(Promise.resolve(false));

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        BusquedaListPage,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'players', redirectTo: '' }])
      ],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: mockPlayerService },
        { provide: LayoutService, useValue: { setHeader: () => { }, setBreadcrumbs: () => { } } },
        { provide: AuthService, useValue: { userData: () => null, currentUser: () => ({ uid: 'test', email: 'test@test.com' }) } },
        { provide: LocationPlugin, useValue: mockLocationPlugin },
        { provide: MapPlugin, useValue: mockMapPlugin },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfettiService, useValue: mockConfettiService },
        { provide: ModalController, useValue: { create: () => Promise.resolve({ present: () => { }, onWillDismiss: () => Promise.resolve() }) } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  // =========================================================================
  // INICIALIZACIÓN
  // =========================================================================
  describe('Inicialización', () => {
    it('debería crearse el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debería inicializar con selección vacía', () => {
      expect(component.selectedPlayers.size).toBe(0);
    });

    it('debería inicializar con tipo de búsqueda "player"', () => {
      expect(component.searchType).toBe('player');
    });

    it('debería inicializar isCheckingGeo como false después de verificar', () => {
      // After waitForAsync + fixture.detectChanges, ngOnInit has completed, so isCheckingGeo = false
      expect(component.isCheckingGeo).toBeFalse();
    });

    it('debería cargar mis jugadores al iniciar', () => {
      expect(mockPlayerService.getPlayers).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // BÚSQUEDA
  // =========================================================================
  describe('Búsqueda', () => {
    it('no debería buscar si la query tiene menos de 3 caracteres', () => {
      component.apiSearchQuery = 'AB';
      component.searchType = 'player';
      component.onSearchInput();
      expect(mockPlayerService.searchTSDBPlayers).not.toHaveBeenCalled();
    });

    it('debería buscar ligas cuando searchType es "league"', () => {
      mockPlayerService.searchTSDBLeagues.and.returnValue(of([{ idLeague: '1', strLeague: 'Premier League' }]));
      component.searchType = 'league';
      component.apiSearchQuery = 'Premier';
      component.onSearchInput();
      expect(mockPlayerService.searchTSDBLeagues).toHaveBeenCalledWith('Premier');
    });

    it('debería buscar equipos cuando searchType es "team"', () => {
      mockPlayerService.searchTSDBTeams.and.returnValue(of([{ idTeam: '1', strTeam: 'Barcelona' }]));
      component.searchType = 'team';
      component.apiSearchQuery = 'Barcelona';
      component.onSearchInput();
      expect(mockPlayerService.searchTSDBTeams).toHaveBeenCalledWith('Barcelona');
    });

    it('debería buscar jugadores cuando searchType es "player"', () => {
      mockPlayerService.searchTSDBPlayers.and.returnValue(of([{ idPlayer: '1', strPlayer: 'Messi' }]));
      component.searchType = 'player';
      component.apiSearchQuery = 'Messi';
      component.onSearchInput();
      expect(mockPlayerService.searchTSDBPlayers).toHaveBeenCalledWith('Messi');
    });

    it('debería deduplicar jugadores con el mismo idPlayer', () => {
      const duplicatePlayers = [
        { idPlayer: '1', strPlayer: 'Messi' },
        { idPlayer: '1', strPlayer: 'Messi' }, // duplicado
        { idPlayer: '2', strPlayer: 'Ronaldo' }
      ];
      mockPlayerService.searchTSDBPlayers.and.returnValue(of(duplicatePlayers));
      component.searchType = 'player';
      component.apiSearchQuery = 'Test';
      component.onSearchInput();
      expect(component.players.length).toBe(2);
    });

    it('debería normalizar URLs de badges de equipos al buscar', () => {
      const teams = [{ idTeam: '1', strTeam: 'Arsenal', strTeamBadge: 'badge.png' }];
      mockPlayerService.searchTSDBTeams.and.returnValue(of(teams));
      component.searchType = 'team';
      component.apiSearchQuery = 'Arsenal';
      component.onSearchInput();
      expect(component.teamResults[0].strTeamBadge).toContain('https://www.thesportsdb.com');
    });

    it('debería devolver el placeholder correcto por tipo de búsqueda', () => {
      component.searchType = 'player';
      expect(component.getSearchPlaceholder()).toContain('Balón de Oro');
      component.searchType = 'team';
      expect(component.getSearchPlaceholder()).toContain('club');
      component.searchType = 'league';
      expect(component.getSearchPlaceholder()).toContain('liga');
    });
  });

  // =========================================================================
  // NAVEGACIÓN (LIGA → EQUIPO → JUGADOR)
  // =========================================================================
  describe('Flujo Liga → Equipo → Jugador', () => {
    it('debería cargar equipos al seleccionar una liga', () => {
      const teams = [{ idTeam: '1', strTeam: 'Arsenal', strTeamBadge: 'https://badge.png' }];
      mockPlayerService.getTeamsByLeague.and.returnValue(of(teams));
      const league = { idLeague: '4328', strLeague: 'Premier League' };

      component.selectLeague(league);

      expect(component.selectedLeague).toEqual(league);
      expect(mockPlayerService.getTeamsByLeague).toHaveBeenCalledWith('4328');
      expect(component.teamResults.length).toBe(1);
    });

    it('debería cargar jugadores al seleccionar un equipo', () => {
      const players = [
        { idPlayer: '1', strPlayer: 'Saka' },
        { idPlayer: '2', strPlayer: 'Odegaard' }
      ];
      mockPlayerService.getTSDBPlayersByTeam.and.returnValue(of(players));
      const team = { idTeam: '133604', strTeam: 'Arsenal' };

      component.selectTeam(team);

      expect(component.selectedTeam).toEqual(team);
      expect(mockPlayerService.getTSDBPlayersByTeam).toHaveBeenCalledWith('133604');
      expect(component.players.length).toBe(2);
    });

    it('backToLeagues() debería limpiar equipo y jugadores', () => {
      component.selectedLeague = { idLeague: '1', strLeague: 'Premier' };
      component.selectedTeam = { idTeam: '1', strTeam: 'Arsenal' };
      component.players = [{ idPlayer: '1', strPlayer: 'Test' }];

      component.backToLeagues();

      expect(component.selectedLeague).toBeNull();
      expect(component.selectedTeam).toBeNull();
      expect(component.players.length).toBe(0);
    });

    it('backToTeams() debería limpiar solo los jugadores', () => {
      component.selectedLeague = { idLeague: '1', strLeague: 'Premier' };
      component.selectedTeam = { idTeam: '1', strTeam: 'Arsenal' };
      component.players = [{ idPlayer: '1', strPlayer: 'Test' }];

      component.backToTeams();

      expect(component.selectedLeague).not.toBeNull();
      expect(component.selectedTeam).toBeNull();
      expect(component.players.length).toBe(0);
    });

    it('clearAll() debería resetear todo el estado de búsqueda', () => {
      component.apiSearchQuery = 'Test';
      component.players = [{ idPlayer: '1', strPlayer: 'Test' }];
      component.leagueResults = [{ idLeague: '1', strLeague: 'Test' }];
      component.teamResults = [{ idTeam: '1', strTeam: 'Test' }];

      component.clearAll();

      expect(component.apiSearchQuery).toBe('');
      expect(component.players.length).toBe(0);
      expect(component.leagueResults.length).toBe(0);
      expect(component.teamResults.length).toBe(0);
    });
  });

  // =========================================================================
  // SELECCIÓN DE JUGADORES (BASKET)
  // =========================================================================
  describe('Basket de Selección', () => {
    const mockPlayer = { idPlayer: 'p1', strPlayer: 'Messi', strTeam: 'Inter Miami' };

    it('debería seleccionar un jugador al hacer toggle', () => {
      component.togglePlayer(mockPlayer);
      expect(component.selectedPlayers.has('p1')).toBeTrue();
    });

    it('debería deseleccionar un jugador si ya estaba seleccionado', () => {
      component.selectedPlayers.set('p1', mockPlayer);
      component.togglePlayer(mockPlayer);
      expect(component.selectedPlayers.has('p1')).toBeFalse();
    });

    it('no debería permitir seleccionar más de 11 jugadores', () => {
      for (let i = 1; i <= 11; i++) {
        component.selectedPlayers.set(`p${i}`, { idPlayer: `p${i}`, strPlayer: `Jugador ${i}` });
      }
      const extraPlayer = { idPlayer: 'p12', strPlayer: 'Extra' };
      component.togglePlayer(extraPlayer);
      expect(component.selectedPlayers.size).toBe(11);
    });

    it('clearSelection() debería vaciar el basket', () => {
      component.selectedPlayers.set('p1', mockPlayer);
      component.clearSelection();
      expect(component.selectedPlayers.size).toBe(0);
    });

    it('getPlayerName() debería devolver el nombre del jugador', () => {
      component.selectedPlayers.set('p1', mockPlayer);
      expect(component.getPlayerName('p1')).toBe('Messi');
    });

    it('getPlayerTeam() debería devolver el equipo del jugador', () => {
      component.selectedPlayers.set('p1', mockPlayer);
      expect(component.getPlayerTeam('p1')).toBe('Inter Miami');
    });

    it('selectAll() debería seleccionar todos los jugadores visibles (máximo 11)', () => {
      component.players = Array.from({ length: 5 }, (_, i) => ({
        idPlayer: `p${i}`, strPlayer: `Jugador ${i}`, strTeam: 'Equipo'
      }));
      component.myPlayers = [];
      component.selectAll();
      expect(component.selectedPlayers.size).toBe(5);
    });
  });

  // =========================================================================
  // PAGINACIÓN
  // =========================================================================
  describe('Paginación', () => {
    beforeEach(() => {
      component.players = Array.from({ length: 20 }, (_, i) => ({ idPlayer: `p${i}`, strPlayer: `J${i}` }));
    });

    it('debería calcular el total de páginas correctamente', () => {
      expect(component.totalPages).toBe(3); // 20 jugadores / 8 por página = 3 páginas
    });

    it('goToPage() debería cambiar la página activa', () => {
      component.goToPage(2);
      expect(component.activePage).toBe(2);
    });

    it('pagedResults debería devolver solo los items de la página actual', () => {
      component.goToPage(1);
      expect(component.pagedResults.length).toBe(8);
    });
  });

  // =========================================================================
  // IMPORTACIÓN
  // =========================================================================
  describe('Importación de Jugadores', () => {
    it('no debería importar si no hay jugadores seleccionados', () => {
      component.importPlayers();
      expect(mockPlayerService.addPlayer).not.toHaveBeenCalled();
    });

    it('no debería importar si no hay ubicación GPS', () => {
      component.selectedPlayers.set('p1', { idPlayer: 'p1', strPlayer: 'Messi' });
      component.hasLocation = false;
      component.importPlayers();
      expect(mockToastService.showError).toHaveBeenCalled();
    });

    it('debería completar la importación y mostrar toast de éxito', fakeAsync(() => {
      component.selectedPlayers.set('p1', { idPlayer: 'p1', strPlayer: 'Messi' });
      component.hasLocation = true;
      component.currentLocation = { type: 'Point', coordinates: [-3.7038, 40.4168] };
      mockPlayerService.lookupTSDBPlayer.and.returnValue(of({ idPlayer: 'p1', strPlayer: 'Messi' }));
      mockPlayerService.mapTSDBToPlayer.and.returnValue({ name: 'Messi' });
      mockPlayerService.addPlayer.and.returnValue(of({ id: 'new1' }));

      component.importPlayers();
      tick(2100);

      expect(mockToastService.showSuccess).toHaveBeenCalled();
      expect(mockConfettiService.goldCelebrate).toHaveBeenCalled();
      
      flush(); // clear any remaining timers
    }));
  });

  // =========================================================================
  // HELPERS
  // =========================================================================
  describe('Helpers', () => {
    it('isAlreadyAdded() debería detectar jugadores ya en el staff', () => {
      component.myPlayers = [{ name: 'messi' }];
      expect(component.isAlreadyAdded('Messi')).toBeTrue();
      expect(component.isAlreadyAdded('Ronaldo')).toBeFalse();
    });

    it('normalizeBadge debería construir URL completa si solo hay nombre de fichero', () => {
      // Accedemos a través de selectLeague que usa internamente normalizeBadge
      mockPlayerService.getTeamsByLeague.and.returnValue(of([
        { idTeam: '1', strTeam: 'Arsenal', strTeamBadge: 'somefile.png' }
      ]));
      component.selectLeague({ idLeague: '1', strLeague: '' });
      expect(component.teamResults[0].strTeamBadge).toBe(
        'https://www.thesportsdb.com/images/media/team/badge/somefile.png'
      );
    });

    it('normalizeBadge no debería modificar URLs ya completas', () => {
      mockPlayerService.getTeamsByLeague.and.returnValue(of([
        { idTeam: '1', strTeam: 'Arsenal', strTeamBadge: 'https://existing-url.com/badge.png' }
      ]));
      component.selectLeague({ idLeague: '1', strLeague: '' });
      expect(component.teamResults[0].strTeamBadge).toBe('https://existing-url.com/badge.png');
    });
  });
});

afterEach(() => {
  TestBed.resetTestingModule();
});
