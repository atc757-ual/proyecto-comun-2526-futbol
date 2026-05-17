import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonSpinner, LoadingController, IonBadge, IonList, IonItem, IonLabel,
  IonAvatar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline, footballOutline, alertCircleOutline, chatbubbleEllipsesOutline,
  personAddOutline, peopleOutline, chevronForwardOutline, personCircleOutline, star
} from 'ionicons/icons';
import { PLAYER_SERVICE_TOKEN } from '../../core/services/player.service.token';
import { LayoutService } from '../../core/services/layout.service';
import { RouterModule } from '@angular/router';
import { Player } from '../../core/models/player.model';
import { AI_SERVICE_TOKEN } from '../../core/services/ai.service.token';
import { AIAnalysisResponse } from '../../core/services/ai.service.interface';

@Component({
  selector: 'app-ai-team',
  templateUrl: './ai-team.page.html',
  styleUrls: ['./ai-team.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonSpinner, IonBadge, IonList, IonItem, IonLabel, IonAvatar
  ]
})
export class AiTeamPage implements OnInit {
  private playerService = inject(PLAYER_SERVICE_TOKEN);
  private layoutService = inject(LayoutService);
  private loadingCtrl = inject(LoadingController);
  private aiService = inject(AI_SERVICE_TOKEN);
  private toastCtrl = inject(ToastController);

  public isGenerating = false;
  public analysisData: AIAnalysisResponse | null = null;
  public hasPlayers = false;
  public localPlayers: any[] = []; // Guardamos los jugadores reales para el matching
  public isLoading = true;

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
      star
    });
  }

  ngOnInit() {
    this.layoutService.setHeader({
      title: 'Football AI',
      subtitle: 'Deja que la inteligencia artificial analice tu plantilla',
      showHero: true
    });
    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Football AI', url: '' }
    ]);
    this.checkPlayers();
  }

  async checkPlayers() {
    this.isLoading = true;
    this.playerService.getPlayers().subscribe({
      next: (players) => {
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
                image_url: matchedLocal ? matchedLocal.image_url : null
              };
            });
          }

          // 2. Matching para el Jugador Estrella
          if (data.starPlayer) {
            const matchedStar = this.localPlayers.find(lp => 
              lp.name.toLowerCase().includes(data.starPlayer.toLowerCase()) ||
              data.starPlayer.toLowerCase().includes(lp.name.toLowerCase())
            );
            (data as any).starPlayerImage = matchedStar ? matchedStar.image_url : null;
          }
        }

        this.analysisData = data;
        this.isGenerating = false;
      },
      error: (err) => {
        clearInterval(this.textInterval);
        this.layoutService.setAILoading(false);
        console.error('Error IA:', err);
        this.isGenerating = false;
        
        // Extraer mensaje del backend si existe
        const message = err.error?.result?.description || 'Error al conectar con la IA';
        this.showToast(message, 'danger');
      }
    });
  }

  public getPlayersByZone(zone: string) {
    if (!this.analysisData || !this.analysisData.idealEleven) return [];
    return this.analysisData.idealEleven.filter(p => {
      const pos = (p.position || '').toUpperCase().trim();
      const role = (p.role || '').toUpperCase().trim();

      // Normalizar zona solicitada: PO, DF, MC, DL
      if (zone === 'PO') {
        return pos === 'PO' || pos === 'POR' || pos === 'GK' || pos === 'GOALKEEPER' || pos.includes('PORT') || pos.includes('ARQ') || role.includes('PORT') || role.includes('GOAL');
      }
      if (zone === 'DF') {
        return pos === 'DF' || pos === 'DEF' || pos === 'DEFENSA' || pos === 'DEFENDER' || pos.includes('BACK') || pos.includes('LAT') || role.includes('DEF') || role.includes('BACK') || role.includes('LAT');
      }
      if (zone === 'MC') {
        return pos === 'MC' || pos === 'MED' || pos === 'MID' || pos === 'MIDFIELDER' || pos === 'CENTROCAMPISTA' || pos.includes('VOL') || pos.includes('MED') || role.includes('MID') || role.includes('MED') || role.includes('VOL') || role.includes('CENTRO');
      }
      if (zone === 'DL') {
        return pos === 'DL' || pos === 'DEL' || pos === 'DELANTERO' || pos === 'FORWARD' || pos === 'ATTACKER' || pos === 'ATT' || pos === 'FWD' || pos.includes('WING') || pos.includes('STRI') || pos.includes('EXT') || role.includes('FORW') || role.includes('ATT') || role.includes('STRI') || role.includes('EXT') || role.includes('DEL');
      }
      return pos === zone;
    });
  }

  private async showToast(message: string, type: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
      position: 'top',
      cssClass: type === 'success' ? 'toast-success' : 'toast-error',
      icon: 'alert-circle-outline',
      mode: 'ios',
      buttons: [{ role: 'cancel', text: 'Cerrar' }]
    });
    await toast.present();
  }
}
