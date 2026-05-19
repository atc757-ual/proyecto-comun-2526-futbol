import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, LoadingController, NavController, AlertController, ToastController, ModalController } from '@ionic/angular';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { PlayerDetailPublicPage } from './player-detail-public.page';
import { PLAYER_SERVICE_TOKEN } from '../../../../core/services/players/player.service.token';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { LayoutService } from '../../../../core/services/ui/layout.service';
import { ConfettiService } from '../../../../core/services/ui/confetti.service';
import { LocationPlugin } from '../../../../core/plugins/location-plugin';

const mockPlayer = {
  _id: 'player-001',
  name: 'Lionel Messi',
  team: 'Inter Miami',
  nationality: 'Argentina',
  age: 37,
  position: 'Delantero',
  league: 'MLS',
  number: 10,
  height: '1.70m',
  weight: '67kg',
  summary: 'El mejor jugador de todos los tiempos.',
  isFavorite: false,
  comments: [
    { _id: 'c1', content: 'Increíble jugador', rating: 5, autor_name: 'Juan', created_at: new Date().toISOString() },
    { _id: 'c2', content: 'Leyenda viva', rating: 5, autor_name: 'Pedro', created_at: new Date().toISOString() }
  ],
  social_media: { instagram: 'instagram.com/messi', twitter: 'twitter.com/messi' },
  images: { banner: '', cutout: '' },
  image_url: '',
  user_id: 'owner-uid'
};

const mockPlayerService = {
  getPublicPlayer: jasmine.createSpy('getPublicPlayer').and.returnValue(of(mockPlayer)),
  toggleFavorite: jasmine.createSpy('toggleFavorite').and.returnValue(of({ ...mockPlayer, isFavorite: true })),
  deletePlayer: jasmine.createSpy('deletePlayer').and.returnValue(of({})),
  addPublicComment: jasmine.createSpy('addPublicComment').and.returnValue(of({})),
  updateComment: jasmine.createSpy('updateComment').and.returnValue(of({})),
  deleteComment: jasmine.createSpy('deleteComment').and.returnValue(of({})),
};

const mockLocationPlugin = {
  isGeolocationPermissionGranted: jasmine.createSpy('isGeolocationPermissionGranted').and.returnValue(Promise.resolve(false)),
  requestGeolocationPermission: jasmine.createSpy('requestGeolocationPermission').and.returnValue(Promise.resolve(true))
};

const mockNavCtrl = {
  navigateRoot: jasmine.createSpy('navigateRoot')
};

const mockModalCtrl = {
  create: jasmine.createSpy('create').and.returnValue(
    Promise.resolve({
      present: () => Promise.resolve(),
      onWillDismiss: () => Promise.resolve({ data: true })
    })
  )
};

const mockToastCtrl = {
  create: jasmine.createSpy('create').and.returnValue(
    Promise.resolve({ present: () => {} })
  )
};

const mockConfettiService = {
  goldCelebrate: jasmine.createSpy('goldCelebrate')
};

describe('PlayerDetailPublicPage', () => {
  let component: PlayerDetailPublicPage;
  let fixture: ComponentFixture<PlayerDetailPublicPage>;

  beforeEach(waitForAsync(() => {
    mockPlayerService.getPublicPlayer.and.returnValue(of(mockPlayer));
    mockLocationPlugin.isGeolocationPermissionGranted.and.returnValue(Promise.resolve(false));

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PlayerDetailPublicPage, RouterTestingModule],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: mockPlayerService },
        { provide: AuthService, useValue: { currentUser: () => null } },
        { provide: LayoutService, useValue: { setHeader: () => { }, setBreadcrumbs: () => { } } },
        { provide: ConfettiService, useValue: mockConfettiService },
        { provide: LocationPlugin, useValue: mockLocationPlugin },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: AlertController, useValue: {} },
        { provide: LoadingController, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDetailPublicPage);
    component = fixture.componentInstance;
    component.id = 'player-001'; // Disparar el setter
    fixture.detectChanges();
  }));

  // =========================================================================
  // INICIALIZACIÓN
  // =========================================================================
  describe('Inicialización', () => {
    it('debería crearse el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debería cargar el jugador al recibir el id', () => {
      expect(mockPlayerService.getPublicPlayer).toHaveBeenCalledWith('player-001');
    });

    it('debería asignar el jugador cargado', () => {
      expect(component.player).not.toBeNull();
      expect(component.player?.name).toBe('Lionel Messi');
    });

    it('debería inicializar hasGeoPermission como false si los permisos están denegados', async () => {
      await fixture.whenStable();
      expect(component.hasGeoPermission()).toBeFalse();
    });
  });

  // =========================================================================
  // CARGA DEL JUGADOR
  // =========================================================================
  describe('Carga del Jugador', () => {
    it('debería redirigir a players-public si el jugador no existe', async () => {
      mockPlayerService.getPublicPlayer.and.returnValue(throwError(() => new Error('Not found')));
      await component.loadPlayer('invalid-id');
      expect(mockNavCtrl.navigateRoot).toHaveBeenCalledWith('/players-public');
    });

    it('debería poner isLoading = false tras la carga', async () => {
      await component.loadPlayer('player-001');
      expect(component.isLoading).toBeFalse();
    });
  });

  // =========================================================================
  // TOGGLE FAVORITO
  // =========================================================================
  describe('Toggle Favorito', () => {
    it('debería cambiar el estado de favorito de forma optimista', async () => {
      component.player = { ...mockPlayer, isFavorite: false };
      await component.toggleFavorite();
      expect(component.player?.isFavorite).toBeTrue();
    });

    it('debería lanzar confeti al marcar como favorito', async () => {
      component.player = { ...mockPlayer, isFavorite: false };
      await component.toggleFavorite();
      expect(mockConfettiService.goldCelebrate).toHaveBeenCalled();
    });

    it('no debería lanzar confeti al desmarcar favorito', async () => {
      mockConfettiService.goldCelebrate.calls.reset();
      component.player = { ...mockPlayer, isFavorite: true };
      await component.toggleFavorite();
      expect(mockConfettiService.goldCelebrate).not.toHaveBeenCalled();
    });

    it('debería revertir el cambio si la API falla', async () => {
      mockPlayerService.toggleFavorite.and.returnValue(throwError(() => new Error('fail')));
      component.player = { ...mockPlayer, isFavorite: false };
      await component.toggleFavorite();
      // Debería revertir al estado original
      expect(component.player?.isFavorite).toBeFalse();
    });
  });

  // =========================================================================
  // COMENTARIOS — PAGINACIÓN
  // =========================================================================
  describe('Paginación de Comentarios', () => {
    beforeEach(() => {
      // 10 comentarios para probar la paginación (pageSize = 5)
      component.player = {
        ...mockPlayer,
        comments: Array.from({ length: 10 }, (_, i) => ({
          _id: `c${i}`, content: `Comentario ${i}`, rating: 4, autor_name: 'User', created_at: new Date().toISOString()
        }))
      } as any;
    });

    it('debería calcular el número de páginas correctamente', () => {
      expect(component.totalPages()).toBe(2);
    });

    it('pagedComments() debería devolver 5 comentarios en la página 1', () => {
      component.currentPage = 1;
      expect(component.pagedComments().length).toBe(5);
    });

    it('goToPage() debería actualizar la página actual', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
    });

    it('prevPage() no debería ir más allá de la página 1', () => {
      component.currentPage = 1;
      component.prevPage();
      expect(component.currentPage).toBe(1);
    });

    it('nextPage() no debería sobrepasar el total de páginas', () => {
      component.currentPage = 2;
      component.nextPage();
      expect(component.currentPage).toBe(2);
    });
  });

  // =========================================================================
  // ENVÍO DE COMENTARIO
  // =========================================================================
  describe('Envío de Comentario', () => {
    beforeEach(() => {
      component.player = { ...mockPlayer } as any;
      component.newComment = 'Gran jugador';
      component.anonymousName = 'Invitado';
      component.newRating = 4;
    });

    it('submitComment() no debería enviar si el comentario está vacío', async () => {
      component.newComment = '';
      await component.submitComment();
      expect(mockPlayerService.addPublicComment).not.toHaveBeenCalled();
    });

    it('submitComment() debería llamar al servicio con los datos correctos', async () => {
      component.hasGeoPermission.set(true);
      mockPlayerService.addPublicComment.and.returnValue(of({}));
      await component.submitComment();
      expect(mockPlayerService.addPublicComment).toHaveBeenCalled();
    });

    it('submitComment() debería resetear el formulario tras el envío', async () => {
      component.hasGeoPermission.set(true);
      mockPlayerService.addPublicComment.and.returnValue(of({}));
      await component.submitComment();
      expect(component.newComment).toBe('');
      expect(component.newRating).toBe(5);
    });
  });

  // =========================================================================
  // EDICIÓN DE COMENTARIO
  // =========================================================================
  describe('Edición de Comentario', () => {
    it('startEditing() debería poblar los campos de edición', () => {
      const comment = { id: 'c1', content: 'Test', rating: 3 };
      component.startEditing(comment);
      expect(component.editingCommentId).toBe('c1');
      expect(component.editingContent).toBe('Test');
      expect(component.editingRating).toBe(3);
    });

    it('cancelEditing() debería limpiar el estado de edición', () => {
      component.editingCommentId = 'c1';
      component.editingContent = 'Test';
      component.cancelEditing();
      expect(component.editingCommentId).toBeNull();
      expect(component.editingContent).toBe('');
    });
  });

  // =========================================================================
  // UTILIDADES
  // =========================================================================
  describe('Utilidades', () => {
    it('getRatingStars() debería devolver un array de 5 iconos', () => {
      const stars = component.getRatingStars(4);
      expect(stars.length).toBe(5);
      expect(stars.filter(s => s === 'star').length).toBe(4);
      expect(stars.filter(s => s === 'star-outline').length).toBe(1);
    });

    it('toggleSummary() debería cambiar el estado de expansión del resumen', () => {
      expect(component.isSummaryExpanded).toBeFalse();
      component.toggleSummary();
      expect(component.isSummaryExpanded).toBeTrue();
    });

    it('toggleCardView() debería alternar showCutout', () => {
      expect(component.showCutout).toBeFalse();
      component.toggleCardView();
      expect(component.showCutout).toBeTrue();
    });

    it('setRating() debería actualizar newRating correctamente', () => {
      component.setRating(3);
      expect(component.newRating).toBe(3);
    });

    it('setRating() en modo edición debería actualizar editingRating', () => {
      component.setRating(2, true);
      expect(component.editingRating).toBe(2);
    });

    it('canDeleteComment() debería devolver false siempre en la vista pública', () => {
      expect(component.canDeleteComment({})).toBeFalse();
    });

    it('isOwner debería ser false si no hay usuario logueado', () => {
      expect(component.isOwner).toBeFalse();
    });

    it('isLoggedIn debería ser false si no hay usuario', () => {
      expect(component.isLoggedIn).toBeFalse();
    });
  });
});
