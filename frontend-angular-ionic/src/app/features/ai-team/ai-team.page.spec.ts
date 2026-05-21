import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AiTeamPage } from './ai-team.page';
import { PLAYER_SERVICE_TOKEN } from '../../core/services/players/player.service.token';
import { AI_SERVICE_TOKEN } from '../../core/services/ai/ai.service.token';
import { LayoutService } from '../../core/services/ui/layout.service';
import { ToastController } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';
import { RouterModule } from '@angular/router';

describe('AiTeamPage (Karma/Jasmine)', () => {
  let component: AiTeamPage;
  let fixture: ComponentFixture<AiTeamPage>;

  let mockPlayerService: any;
  let mockAiService: any;
  let mockLayoutService: any;
  let mockToastCtrl: any;
  let mockToast: any;

  const mockPlayersList = Array.from({ length: 11 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Jugador ${i + 1}`,
    position: i === 0 ? 'PO' : i < 5 ? 'DF' : i < 9 ? 'MC' : 'DL',
    image_url: `url-${i + 1}`
  }));

  beforeEach(async () => {
    mockPlayerService = {
      getPlayers: jasmine.createSpy('getPlayers').and.returnValue(of(mockPlayersList))
    };

    mockAiService = {
      analyzeMyTeam: jasmine.createSpy('analyzeMyTeam').and.returnValue(of({
        analysis: 'Buen equipo con equilibrio táctico.',
        formation: '4-3-3',
        starPlayer: 'Jugador 5',
        justification: 'Es el que más aporta al ataque.',
        idealEleven: mockPlayersList.map(p => ({
          name: p.name,
          position: p.position,
          role: 'Titular'
        })),
        tacticalRecommendations: ['Mejorar transición', 'Presionar arriba']
      }))
    };

    mockLayoutService = {
      setHeader: jasmine.createSpy('setHeader'),
      setBreadcrumbs: jasmine.createSpy('setBreadcrumbs'),
      setAILoading: jasmine.createSpy('setAILoading')
    };

    mockToast = {
      present: jasmine.createSpy('present')
    };

    mockToastCtrl = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockToast))
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        AiTeamPage
      ],
      providers: [
        { provide: PLAYER_SERVICE_TOKEN, useValue: mockPlayerService },
        { provide: AI_SERVICE_TOKEN, useValue: mockAiService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: ToastController, useValue: mockToastCtrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiTeamPage);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize header and breadcrumbs on ngOnInit', () => {
    component.ngOnInit();
    expect(mockLayoutService.setHeader).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Fútbol AI' }));
    expect(mockLayoutService.setBreadcrumbs).toHaveBeenCalled();
  });

  it('should load players and detect if has 11 or more players', () => {
    component.ngOnInit();
    expect(mockPlayerService.getPlayers).toHaveBeenCalled();
    expect(component.localPlayers.length).toBe(11);
    expect(component.hasPlayers).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('should mark hasPlayers as false if there are less than 11 players', () => {
    mockPlayerService.getPlayers.and.returnValue(of(mockPlayersList.slice(0, 5)));
    component.ngOnInit();
    expect(component.localPlayers.length).toBe(5);
    expect(component.hasPlayers).toBeFalse();
  });

  it('should trigger AI team generation and set analysisData upon success', fakeAsync(() => {
    component.ngOnInit();
    component.generateTeam();
    
    expect(mockLayoutService.setAILoading).toHaveBeenCalledWith(true, jasmine.any(String));
    tick(2100); // Avanzar tiempo del intervalo de texto
    
    expect(mockAiService.analyzeMyTeam).toHaveBeenCalled();
    expect(component.analysisData).not.toBeNull();
    expect(component.analysisData?.starPlayer).toBe('Jugador 5');
    expect(mockLayoutService.setAILoading).toHaveBeenCalledWith(false);
    expect(component.isGenerating).toBeFalse();

    // Comprobar matching de imágenes
    expect(component.analysisData?.idealEleven[0].image_url).toBe('url-1');
    expect((component.analysisData as any).starPlayerImage).toBe('url-5');

    // Detener intervalo asíncrono pendiente
    component.generateTeam();
    tick(100);
  }));

  it('should filter players by tactical zone correctly', () => {
    component.analysisData = {
      analysis: 'Test',
      formation: '4-3-3',
      starPlayer: 'Jugador 5',
      justification: 'Test',
      idealEleven: [
        { name: 'Portero', position: 'PO', role: 'Portero' },
        { name: 'Defensa Central', position: 'DF', role: 'Central' },
        { name: 'Mediocentro', position: 'MC', role: 'Pivote' },
        { name: 'Extremo', position: 'DL', role: 'Extremo' }
      ],
      tacticalRecommendations: []
    };

    const porteros = component.getPlayersByZone('PO');
    const defensas = component.getPlayersByZone('DF');
    const medios = component.getPlayersByZone('MC');
    const delanteros = component.getPlayersByZone('DL');

    expect(porteros.length).toBe(1);
    expect(porteros[0].name).toBe('Portero');
    expect(defensas.length).toBe(1);
    expect(medios.length).toBe(1);
    expect(delanteros.length).toBe(1);
  });

  it('should handle AI analysis errors and present error toast', fakeAsync(() => {
    mockAiService.analyzeMyTeam.and.returnValue(throwError(() => ({
      error: { result: { description: 'Fallo simulado de la IA' } }
    })));

    component.generateTeam();
    tick();

    expect(mockToastCtrl.create).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Fallo simulado de la IA',
      cssClass: 'toast-error'
    }));
    expect(mockToast.present).toHaveBeenCalled();
    expect(component.isGenerating).toBeFalse();
  }));
});
