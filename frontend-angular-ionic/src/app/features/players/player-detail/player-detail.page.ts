import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { 
  IonIcon, IonCard, IonCardContent, IonCardHeader,
  IonCardTitle, IonButton, IonAvatar, IonBadge,
  IonSpinner, LoadingController, NavController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  star, starOutline, footballOutline, shieldOutline, 
  locationOutline, calendarOutline, personOutline,
  statsChartOutline, chatbubbleOutline, createOutline, trashOutline,
  closeCircleOutline, flagOutline, earthOutline, logoInstagram,
  logoFacebook, logoTwitter, globeOutline, sendOutline,
  checkmarkCircleOutline, alertCircleOutline, heart, heartOutline,
  trophyOutline, chevronUpOutline, chevronDownOutline
} from 'ionicons/icons';
import { PlayerService, Player } from '../../../core/services/player.service';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.page.html',
  styleUrls: ['./player-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonSpinner, IonBadge
  ]
})
export class PlayerDetailPage implements OnInit {
  @Input() set id(playerId: string) {
    if (playerId) {
      this.loadPlayer(playerId);
    }
  }

  private playerService = inject(PlayerService);
  private authService = inject(AuthService);
  private loadingCtrl = inject(LoadingController);
  private navCtrl = inject(NavController);
  private layoutService = inject(LayoutService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  public player: Player | null = null;
  public honours: any[] = [];
  public career: any[] = [];
  public isLoading = true;
  public isLoadingExtra = false;
  public isAdmin = false;

  // Lógica de "Ver más"
  public isSummaryExpanded = false;

  // Lógica de Comentarios
  public newComment = '';
  public newRating = 5;
  public isSubmittingComment = false;

  constructor() {
    addIcons({
      star, starOutline, footballOutline, shieldOutline, 
      locationOutline, calendarOutline, personOutline,
      statsChartOutline, chatbubbleOutline, createOutline,
      trashOutline, closeCircleOutline, flagOutline,
      earthOutline, logoInstagram, logoFacebook, logoTwitter,
      globeOutline, sendOutline, checkmarkCircleOutline,
      alertCircleOutline, heart, heartOutline,
      trophyOutline, chevronUpOutline, chevronDownOutline
    });
  }

  async ngOnInit() {
    this.layoutService.setHeader({ 
      title: 'Ficha del Crack', 
      subtitle: 'Estadísticas y detalles técnicos',
      showHero: true 
    });
    this.isAdmin = this.authService.isAdmin();
  }

  async loadPlayer(id: string) {
    this.isLoading = true;
    this.playerService.getPlayer(id).subscribe({
      next: (data) => {
        this.player = data;
        this.isLoading = false;
        
        // Si el jugador viene de TSDB, cargamos info extra (V2)
        if (this.player?.tsdb_ids?.player_id) {
          this.loadExtraInfo(this.player.tsdb_ids.player_id);
        }
      },
      error: () => {
        this.isLoading = false;
        this.navCtrl.back();
      }
    });
  }

  loadExtraInfo(tsdbId: string) {
    this.isLoadingExtra = true;
    forkJoin({
      career: this.playerService.getPlayerTeamsHistory(tsdbId),
      honours: this.playerService.getPlayerHonours(tsdbId)
    }).subscribe({
      next: (res) => {
        this.career = res.career;
        this.honours = res.honours;
        this.isLoadingExtra = false;
      },
      error: () => this.isLoadingExtra = false
    });
  }

  async toggleFavorite() {
    if (!this.player?._id) return;
    const newStatus = !this.player.isFavorite;
    
    this.playerService.toggleFavorite(this.player._id, newStatus).subscribe({
      next: (updatedPlayer) => {
        if (this.player) this.player.isFavorite = updatedPlayer.isFavorite;
        const msg = newStatus ? 'Añadido a favoritos' : 'Eliminado de favoritos';
        this.showToast(msg, 'success', newStatus ? 'heart' : 'heart-outline');
      },
      error: () => this.showToast('Error al actualizar favorito', 'danger')
    });
  }

  async deletePlayer() {
    if (!this.player?._id) return;

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar Crack?',
      message: `¿Estás seguro de que quieres borrar a ${this.player.name}? Esta acción no se puede deshacer.`,
      mode: 'ios',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.playerService.deletePlayer(this.player!._id!).subscribe({
              next: () => {
                this.showToast('Jugador eliminado correctamente', 'success');
                this.navCtrl.back();
              },
              error: () => this.showToast('Error al eliminar jugador', 'danger')
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteComment(commentId: string) {
    if (!this.player?._id) return;

    const alert = await this.alertCtrl.create({
      header: 'Borrar Comentario',
      message: '¿Quieres eliminar este comentario?',
      mode: 'ios',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar',
          role: 'destructive',
          handler: () => {
            this.playerService.deleteComment(this.player!._id!, commentId).subscribe({
              next: () => {
                this.showToast('Comentario eliminado', 'success', 'trash-outline');
                this.loadPlayer(this.player!._id!);
              },
              error: () => this.showToast('No se pudo borrar el comentario', 'danger', 'alert-circle-outline')
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async editComment(comment: any) {
    if (!this.player?._id || !comment._id) return;

    const alert = await this.alertCtrl.create({
      header: 'Editar Comentario',
      mode: 'ios',
      inputs: [
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'Tu comentario...',
          value: comment.content
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.content.trim()) return;
            this.playerService.updateComment(this.player!._id!, comment._id, { content: data.content }).subscribe({
              next: () => {
                this.showToast('Comentario actualizado', 'success', 'checkmark-circle-outline');
                this.loadPlayer(this.player!._id!);
              },
              error: () => this.showToast('Error al actualizar comentario', 'danger')
            });
          }
        }
      ]
    });

    await alert.present();
  }

  // --- LÓGICA DE COMENTARIOS ---
  setRating(rating: number) {
    this.newRating = rating;
  }

  async submitComment() {
    if (!this.newComment.trim()) return;
    if (!this.player?._id) return;

    this.isSubmittingComment = true;
    const user = this.authService.currentUser();
    
    const commentData = {
      content: this.newComment,
      rating: this.newRating,
      autor_name: user?.displayName || 'Usuario',
      user_id: user?.uid
    };

    this.playerService.addComment(this.player._id, commentData).subscribe({
      next: () => {
        this.showToast('¡Comentario añadido!', 'success', 'checkmark-circle-outline');
        this.newComment = '';
        this.newRating = 5;
        this.isSubmittingComment = false;
        this.loadPlayer(this.player!._id!); // Recargar para ver el nuevo comentario
      },
      error: () => {
        this.showToast('Error al publicar comentario', 'danger', 'alert-circle-outline');
        this.isSubmittingComment = false;
      }
    });
  }

  // --- LÓGICA DE BIOGRAFÍA ---
  toggleSummary() {
    this.isSummaryExpanded = !this.isSummaryExpanded;
  }

  canDeleteComment(comment: any): boolean {
    if (this.isAdmin) return true;
    const currentUser = this.authService.currentUser();
    return currentUser?.uid === comment.user_id;
  }

  getRatingStars(rating: number = 0) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 'star' : 'star-outline');
    }
    return stars;
  }

  private async showToast(message: string, color: string, icon: string = 'alert-circle-outline') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: color,
      cssClass: 'premium-toast',
      buttons: [{ icon: icon, side: 'start', handler: () => { } }]
    });
    toast.present();
  }

  handleImageError(event: any) {
    event.target.src = 'assets/img/player-placeholder.png';
  }
}
