import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { PlayersPage } from './players.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { Player } from '../../../core/models/player.model';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

const mockPlayers: Player[] = [
  { _id: '1', name: 'Leo Messi',           team: 'Inter Miami', nationality: 'Argentina', position: 'DEL', league: 'MLS',    user_id: 'u1' },
  { _id: '2', name: 'Cristiano Ronaldo',   team: 'Al Nassr',    nationality: 'Portugal',  position: 'DEL', league: 'Saudi',  user_id: 'u1' },
  { _id: '3', name: 'Pedri González',      team: 'Barcelona',   nationality: 'España',    position: 'MC',  league: 'LaLiga', user_id: 'u1' },
  { _id: '4', name: 'Vinicius Jr.',        team: 'Real Madrid', nationality: 'Brasil',    position: 'EX',  league: 'LaLiga', user_id: 'u1' },
  { _id: '5', name: 'Kylian Mbappé',       team: 'Real Madrid', nationality: 'Francia',   position: 'DEL', league: 'LaLiga', user_id: 'u1' },
  { _id: '6', name: 'Erling Haaland',      team: 'Man City',    nationality: 'Noruega',   position: 'DEL', league: 'Premier',user_id: 'u1' },
  { _id: '7', name: 'Lamine Yamal',        team: 'Barcelona',   nationality: 'España',    position: 'EX',  league: 'LaLiga', user_id: 'u1' },
  { _id: '8', name: 'Rodri Hernández',     team: 'Man City',    nationality: 'España',    position: 'MC',  league: 'Premier',user_id: 'u1' },
  { _id: '9', name: 'Bukayo Saka',         team: 'Arsenal',     nationality: 'Inglaterra',position: 'EX',  league: 'Premier',user_id: 'u1' },
  { _id: '10', name: 'Marc-André ter Stegen', team: 'Barcelona', nationality: 'Alemania', position: 'POR', league: 'LaLiga', user_id: 'u1' },
];

function buildProviders(options: { players?: Player[]; isAdmin?: boolean; loadError?: boolean } = {}) {
  const { players = mockPlayers, isAdmin = false, loadError = false } = options;
  return [
    {
      provide: PLAYER_SERVICE_TOKEN,
      useValue: {
        getPlayers: () => loadError ? throwError(() => new Error('Server error')) : of(players),
        deletePlayer: (_id: string) => of(null)
      }
    },
    {
      provide: AuthService,
      useValue: { isAdmin: () => isAdmin, currentUser: () => null }
    },
    {
      provide: LayoutService,
      useValue: { setHeader: () => {}, setBreadcrumbs: () => {} }
    },
    {
      provide: ModalController,
      useValue: {
        create: jasmine.createSpy('create').and.returnValue(
          Promise.resolve({ present: () => Promise.resolve(), onWillDismiss: () => Promise.resolve({ data: false }) })
        )
      }
    },
    {
      provide: ToastService,
      useValue: {
        showSuccess: jasmine.createSpy('showSuccess').and.returnValue(Promise.resolve()),
        showError: jasmine.createSpy('showError').and.returnValue(Promise.resolve())
      }
    }
  ];
}

describe('PlayersPage', () => {
  let component: PlayersPage;
  let fixture: ComponentFixture<PlayersPage>;

  function setup(options: Parameters<typeof buildProviders>[0] = {}) {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PlayersPage, HttpClientTestingModule, RouterTestingModule],
      providers: buildProviders(options),
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('creation and init', () => {
    beforeEach(waitForAsync(() => setup()));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call loadPlayers on init', () => {
      spyOn(component, 'loadPlayers').and.callThrough();
      component.ngOnInit();
      expect(component.loadPlayers).toHaveBeenCalled();
    });

    it('should set isAdmin to false for non-admin user', () => {
      expect(component.isAdmin).toBeFalse();
    });

    it('should have isLoading false after players are loaded', () => {
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('filteredPlayers (computed signal)', () => {
    beforeEach(waitForAsync(() => setup()));

    it('should return all 10 players when searchTerm is empty', () => {
      expect(component.filteredPlayers().length).toBe(10);
    });

    it('should filter by player name (case-insensitive)', () => {
      component.searchTerm.set('messi');
      const result = component.filteredPlayers();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Leo Messi');
    });

    it('should filter by team name', () => {
      component.searchTerm.set('barcelona');
      const result = component.filteredPlayers();
      expect(result.length).toBe(3); // Pedri, Lamine, ter Stegen
      result.forEach(p => expect(p.team.toLowerCase()).toContain('barcelona'));
    });

    it('should filter by nationality', () => {
      component.searchTerm.set('españa');
      const result = component.filteredPlayers();
      expect(result.length).toBe(3); // Pedri, Lamine, Rodri
      result.forEach(p => expect(p.nationality?.toLowerCase()).toContain('españa'));
    });

    it('should filter by league', () => {
      component.searchTerm.set('premier');
      const result = component.filteredPlayers();
      expect(result.length).toBe(3); // Haaland, Rodri, Saka
    });

    it('should return empty array when no match', () => {
      component.searchTerm.set('xyz_no_match_12345');
      expect(component.filteredPlayers().length).toBe(0);
    });

    it('onSearchChange should update searchTerm', () => {
      component.onSearchChange({ detail: { value: 'Real Madrid' } } as any);
      const result = component.filteredPlayers();
      expect(result.length).toBe(2); // Vinicius, Mbappé
    });

    it('onSearchChange should reset to page 1', () => {
      component.currentPage.set(2);
      component.onSearchChange({ detail: { value: 'messi' } } as any);
      expect(component.currentPage()).toBe(1);
    });

    it('onClear should reset searchTerm and page', () => {
      component.searchTerm.set('messi');
      component.currentPage.set(2);
      component.onClear();
      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('pagination (computed signals)', () => {
    beforeEach(waitForAsync(() => setup()));

    it('totalPages should be 2 for 10 players at 8 per page', () => {
      expect(component.totalPages()).toBe(2);
    });

    it('pagedPlayers should return 8 items on page 1', () => {
      expect(component.pagedPlayers().length).toBe(8);
    });

    it('pagedPlayers should return 2 items on page 2', () => {
      component.currentPage.set(2);
      expect(component.pagedPlayers().length).toBe(2);
    });

    it('prevPage should decrement current page', () => {
      component.currentPage.set(2);
      component.prevPage();
      expect(component.currentPage()).toBe(1);
    });

    it('prevPage should NOT go below page 1', () => {
      component.currentPage.set(1);
      component.prevPage();
      expect(component.currentPage()).toBe(1);
    });

    it('nextPage should increment current page', () => {
      component.currentPage.set(1);
      component.nextPage();
      expect(component.currentPage()).toBe(2);
    });

    it('nextPage should NOT exceed totalPages', () => {
      component.currentPage.set(2);
      component.nextPage();
      expect(component.currentPage()).toBe(2);
    });

    it('goToPage should set the page to the given value', () => {
      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
    });

    it('goToPage should NOT accept a page below 1', () => {
      component.currentPage.set(1);
      component.goToPage(0);
      expect(component.currentPage()).toBe(1);
    });

    it('goToPage should NOT accept a page above totalPages', () => {
      component.currentPage.set(1);
      component.goToPage(99);
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('getPages window', () => {
    beforeEach(waitForAsync(() => setup()));

    it('should return [1, 2] for 10 players (2 pages)', () => {
      expect(component.getPages()).toEqual([1, 2]);
    });

    it('should cap the window at 5 pages when there are many pages', () => {
      component.itemsPerPage.set(1); // 1 player per page → 10 pages
      expect(component.getPages().length).toBe(5);
    });

    it('window should be centered around current page', () => {
      component.itemsPerPage.set(1); // 10 pages
      component.currentPage.set(5);
      const pages = component.getPages();
      expect(pages).toContain(5);
      expect(pages[0]).toBeLessThanOrEqual(5);
      expect(pages[pages.length - 1]).toBeGreaterThanOrEqual(5);
    });
  });

  describe('trackByPlayerId', () => {
    beforeEach(waitForAsync(() => setup()));

    it('should return player _id when defined', () => {
      const player = mockPlayers[0];
      expect(component.trackByPlayerId(0, player)).toBe('1');
    });

    it('should fall back to index string when _id is undefined', () => {
      const player: Player = { name: 'Test', position: 'DEL', team: 'Test FC', user_id: 'u1' };
      expect(component.trackByPlayerId(3, player)).toBe('3');
    });
  });

  describe('creation — admin user', () => {
    beforeEach(waitForAsync(() => setup({ isAdmin: true })));

    it('should set isAdmin to true for admin user', () => {
      expect(component.isAdmin).toBeTrue();
    });
  });

  describe('creation — on load error', () => {
    beforeEach(waitForAsync(() => setup({ loadError: true })));

    it('should set isLoading to false on load error', () => {
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('getPages window — few players', () => {
    beforeEach(waitForAsync(() => setup({ players: mockPlayers.slice(0, 4) })));

    it('should return all pages when total <= 5', () => {
      component.itemsPerPage.set(1); // 1 per page → 4 pages
      expect(component.getPages().length).toBe(4);
    });
  });
});
