import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { NavController } from '@ionic/angular/standalone';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { PlayersPublicPage } from './players-public.page';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/players/player.service.token';
import { LayoutService } from '../../../../core/services/ui/layout.service';
import { PlatformService } from '../../../../core/services/system/platform.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

const mockPlayers = Array.from({ length: 15 }, (_, i) => ({
  _id: `player-${i}`,
  name: `Jugador ${i}`,
  team: `Equipo ${i % 3}`,
  league: `Liga ${i % 2}`,
  nationality: i % 2 === 0 ? 'Español' : 'Argentino',
  age: 20 + i,
  position: 'Delantero',
  image_url: '',
  created_at: new Date().toISOString()
}));

describe('PlayersPublicPage', () => {
  let component: PlayersPublicPage;
  let fixture: ComponentFixture<PlayersPublicPage>;

  const mockPlayerService = {
    getPublicPlayers: jasmine.createSpy('getPublicPlayers').and.returnValue(of(mockPlayers))
  };

  const mockNavCtrl = {
    navigateRoot: jasmine.createSpy('navigateRoot')
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PlayersPublicPage, RouterTestingModule],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: mockPlayerService },
        { provide: LayoutService, useValue: { setHeader: () => { }, setBreadcrumbs: () => { } } },
        { provide: PlatformService, useValue: { isMobile: false } },
        { provide: AuthService, useValue: { currentUser: () => null } },
        { provide: NavController, useValue: mockNavCtrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersPublicPage);
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

    it('debería cargar los jugadores públicos al iniciar', () => {
      expect(mockPlayerService.getPublicPlayers).toHaveBeenCalled();
    });

    it('debería inicializar isLoading como false tras la carga', () => {
      expect(component.isLoading()).toBeFalse();
    });

    it('debería inicializar con la página 1', () => {
      expect(component.currentPage()).toBe(1);
    });

    it('debería mostrar todos los jugadores cargados', () => {
      expect(component._allPlayers().length).toBe(15);
    });
  });

  // =========================================================================
  // FILTRADO / BÚSQUEDA
  // =========================================================================
  describe('Filtrado y Búsqueda', () => {
    it('debería filtrar jugadores por nombre', () => {
      component.searchTerm.set('Jugador 1');
      const filtered = component.filteredPlayers();
      expect(filtered.every(p => p.name.includes('Jugador 1'))).toBeTrue();
    });

    it('debería filtrar por equipo', () => {
      component.searchTerm.set('Equipo 0');
      const filtered = component.filteredPlayers();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(p => p.team === 'Equipo 0')).toBeTrue();
    });

    it('debería filtrar por nacionalidad', () => {
      component.searchTerm.set('Español');
      const filtered = component.filteredPlayers();
      expect(filtered.every(p => p.nationality === 'Español')).toBeTrue();
    });

    it('debería ser case-insensitive', () => {
      component.searchTerm.set('ESPAÑOL');
      const filtered = component.filteredPlayers();
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('debería devolver todos los jugadores si la búsqueda está vacía', () => {
      component.searchTerm.set('');
      expect(component.filteredPlayers().length).toBe(15);
    });

    it('onSearchChange() debería actualizar el término y resetear la página', () => {
      component.currentPage.set(2);
      component.onSearchChange({ detail: { value: 'test' } });
      expect(component.searchTerm()).toBe('test');
      expect(component.currentPage()).toBe(1);
    });

    it('clearFilters() debería limpiar el término y resetear la página', () => {
      component.searchTerm.set('algo');
      component.currentPage.set(3);
      component.clearFilters();
      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(1);
    });
  });

  // =========================================================================
  // PAGINACIÓN
  // =========================================================================
  describe('Paginación', () => {
    it('debería calcular el total de páginas correctamente', () => {
      // 15 jugadores / 8 por página = 2 páginas
      expect(component.totalPages()).toBe(2);
    });

    it('pagedPlayers debería devolver 8 jugadores en la primera página', () => {
      component.currentPage.set(1);
      expect(component.pagedPlayers().length).toBe(8);
    });

    it('pagedPlayers debería devolver 7 jugadores en la segunda página', () => {
      component.currentPage.set(2);
      expect(component.pagedPlayers().length).toBe(7);
    });

    it('goToPage() debería actualizar la página actual', () => {
      component.goToPage(2);
      expect(component.currentPage()).toBe(2);
    });
  });

  // =========================================================================
  // REDIRECCIÓN
  // =========================================================================
  describe('Redirección', () => {
    it('debería cargar jugadores al inicializar incluso con sesión activa', () => {
      // Recrear con usuario logueado
      TestBed.resetTestingModule();
      const layoutServiceMock2 = jasmine.createSpyObj('LayoutService', ['setHeader', 'setBreadcrumbs']);
      TestBed.configureTestingModule({
        imports: [IonicModule.forRoot(), PlayersPublicPage, RouterTestingModule],
        providers: [
          { provide: PLAYER_SERVICE_TOKEN, useValue: mockPlayerService },
          { provide: LayoutService, useValue: layoutServiceMock2 },
          { provide: PlatformService, useValue: { isMobile: false } },
          { provide: AuthService, useValue: { currentUser: () => ({ uid: 'user1', email: 'u@test.com' }) } },
          { provide: NavController, useValue: mockNavCtrl }
        ]
      }).compileComponents();

      mockPlayerService.getPublicPlayers.calls.reset();
      const f2 = TestBed.createComponent(PlayersPublicPage);
      f2.detectChanges();
      // Verificamos que el título coincida exactamente con lo definido en el componente
      expect(f2.componentInstance.pageTitle).toBe('Nuestros jugadores');
      expect(mockPlayerService.getPublicPlayers).toHaveBeenCalled();
    });
  });
});
