import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonSpinner, IonBadge, IonList, IonItem, IonLabel,
  IonAvatar,
  IonContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline, footballOutline, alertCircleOutline, chatbubbleEllipsesOutline,
  personAddOutline, peopleOutline, chevronForwardOutline, personCircleOutline, star, calendarOutline
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../core/services/players/player.service.token';
import { LayoutService } from '../../core/services/ui/layout.service';
import { RouterModule } from '@angular/router';
import { Player } from '../../core/models/player.model';
import { AI_SERVICE_TOKEN } from '../../core/services/ai/ai.service.token';
import { ToastService } from '../../core/services/ui/toast.service';
import { AIAnalysisResponse } from '../../core/services/ai/ai.service.interface';
import { PageFullContentComponent } from '../../shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from '../../shared/components/layout/layout-elements/page-footer/page-footer.component';

@Component({
  selector: 'app-ai-team',
  templateUrl: './ai-team.page.html',
  styleUrls: ['./ai-team.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent,
    PageFullContentComponent,
    PageFooterComponent,
    IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonSpinner, IonBadge, IonList, IonItem, IonLabel, IonAvatar
  ]
})
export class AiTeamPage implements OnInit {
  private readonly playerService = inject(PLAYER_SERVICE_TOKEN);
  private readonly layoutService = inject(LayoutService);
  private readonly aiService = inject(AI_SERVICE_TOKEN);
  private readonly toastService = inject(ToastService);

  public isGenerating = false;
  public analysisData: AIAnalysisResponse | null = null;
  public hasPlayers = false;
  public localPlayers: Player[] = []; // Guardamos los jugadores reales para el matching
  public isLoading = true;
  // Header bindings for app-page-full-content
  public pageTitle: string = 'Fútbol AI';
  public pageSubtitle: string = 'Deja que la inteligencia artificial analice tu plantilla';
  public breadcrumbs = [
    { label: '', url: '/home', icon: 'home-outline' },
    { label: 'Fútbol AI', url: '' }
  ];


  constructor() {
    addIcons({
      sparklesOutline,
      footballOutline,
      alertCircleOutline,
      chatbubbleEllipsesOutline,
      personAddOutline,
      peopleOutline,
      chevronForwardOutline,
      personCircleOutline,
      star,
      calendarOutline
    });
  }

  ngOnInit() {
    this.checkPlayers();
  }

  async checkPlayers() {
    this.isLoading = true;
    this.playerService.getPlayers().subscribe({
      next: (players: Player[]) => {
        this.localPlayers = players || [];
        this.hasPlayers = this.localPlayers.length >= 11;
        this.isLoading = false;
      },
      error: () => {
        this.localPlayers = [];
        this.hasPlayers = false;
        this.isLoading = false;
      }
    });
  }

  public currentThinkingText = 'Iniciando motores cuánticos...';
  private textInterval: any;
  private thinkingPhrases = [
    'Analizando métricas de rendimiento...',
    'Calculando sinergias tácticas...',
    'Evaluando posiciones y veteranía...',
    'Aplicando modelos de Big Data...',
    'Entrenando red neuronal...',
    'Generando informe estratégico final...'
  ];

  async generateTeam() {
    this.isGenerating = true;
    this.analysisData = null;

    let textIndex = 0;
    this.currentThinkingText = this.thinkingPhrases[0];
    this.layoutService.setAILoading(true, this.currentThinkingText);

    this.textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % this.thinkingPhrases.length;
      this.currentThinkingText = this.thinkingPhrases[textIndex];
      this.layoutService.setAILoading(true, this.currentThinkingText);
    }, 2000);

    this.aiService.analyzeMyTeam().subscribe({
      next: (data) => {
        clearInterval(this.textInterval);
        this.layoutService.setAILoading(false);

        // --- LÓGICA DE MATCHING DE IMÁGENES ---
        if (data) {
          // 1. Matching para el Once Ideal
          if (data.idealEleven) {
            data.idealEleven = data.idealEleven.map(aiPlayer => {
              const matchedLocal = this.localPlayers.find(lp =>
                lp.name.toLowerCase().includes(aiPlayer.name.toLowerCase()) ||
                aiPlayer.name.toLowerCase().includes(lp.name.toLowerCase())
              );
              return {
                ...aiPlayer,
                image_url: matchedLocal ? matchedLocal.image_url : undefined
              };
            });
          }

          // 2. Matching para el Jugador Estrella
          if (data.starPlayer) {
            const matchedStar = this.localPlayers.find(lp =>
              lp.name.toLowerCase().includes(data.starPlayer.toLowerCase()) ||
              data.starPlayer.toLowerCase().includes(lp.name.toLowerCase())
            );
            (data as any).starPlayerImage = matchedStar ? matchedStar.image_url : undefined;
          }
        }

        this.analysisData = data;
        this.isGenerating = false;
      },
      error: (err) => {
        clearInterval(this.textInterval);
        this.layoutService.setAILoading(false);
        this.isGenerating = false;
        const errorMessage = err?.error?.result?.descriptionDetail || 'Error al conectar con la IA';
        this.toastService.showError(errorMessage);
      }
    });
  }

  public getPlayersByZone(zone: string) {
    if (!this.analysisData || !this.analysisData.idealEleven) return [];
    return this.analysisData.idealEleven.filter(p => {
      const pos = (p.position || '').toUpperCase().trim();
      const role = (p.role || '').toUpperCase().trim();

      // Normalizar zona solicitada: PO, DF, MC, DL
      switch (zone) {
        case 'PO':
          return pos === 'PO' || pos === 'POR' || pos === 'GK' || pos === 'GOALKEEPER' || pos.includes('PORT') || pos.includes('ARQ') || role.includes('PORT') || role.includes('GOAL');
        case 'DF':
          return pos === 'DF' || pos === 'DEF' || pos === 'DEFENSA' || pos === 'DEFENDER' || pos.includes('BACK') || pos.includes('LAT') || role.includes('DEF') || role.includes('BACK') || role.includes('LAT');
        case 'MC':
          return pos === 'MC' || pos === 'MED' || pos === 'MID' || pos === 'MIDFIELDER' || pos === 'CENTROCAMPISTA' || pos.includes('VOL') || pos.includes('MED') || role.includes('MID') || role.includes('MED') || role.includes('VOL') || role.includes('CENTRO');
        case 'DL':
          return pos === 'DL' || pos === 'DEL' || pos === 'DELANTERO' || pos === 'FORWARD' || pos === 'ATTACKER' || pos === 'ATT' || pos === 'FWD' || pos.includes('WING') || pos.includes('STRI') || pos.includes('EXT') || role.includes('FORW') || role.includes('ATT') || role.includes('STRI') || role.includes('EXT') || role.includes('DEL');
        default:
          return pos === zone;
      }
    });
  }

  getPositionLabel(position: string): string {
    const labels: Record<string, string> = {
      'PO': 'Portero',
      'DF': 'Defensa',
      'MC': 'Centrocampista',
      'DL': 'Delantero'
    };
    return labels[(position || '').toUpperCase()] || position;
  }

  trackByAIPlayerName(_: number, player: { name: string }): string {
    return player.name;
  }

  trackByIndex(index: number): number {
    return index;
  }
}

