import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonIcon, IonSearchbar, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
  IonThumbnail, IonBadge, IonContent
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline, filterOutline, personOutline, happyOutline,
  thumbsUpOutline, sadOutline, shieldOutline, searchOutline, trashOutline, createOutline,
  personAddOutline, optionsOutline, flagOutline, chevronForwardOutline, calendarOutline, settingsOutline,
  closeCircleOutline, closeCircle, chevronBackOutline, eyeOutline, alertCircleOutline,
  checkmarkCircleOutline, checkmarkCircle, peopleOutline, homeOutline, closeOutline, heart
} from 'ionicons/icons';
import { Player } from '../../../core/models/player.model';
import { PlayerListBase } from '../player-list-base';
import { PageFullContentComponent } from '../../../shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from '../../../shared/components/layout/layout-elements/page-footer/page-footer.component';

@Component({
  selector: 'app-players-all',
  templateUrl: './players-all.page.html',
  styleUrls: ['./players-all.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonButton, IonIcon, IonSearchbar, IonSpinner,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
    IonThumbnail, IonBadge, PageFullContentComponent, PageFooterComponent, IonContent
  ]
})
export class PlayersAllPage extends PlayerListBase implements OnInit {

  isMine(p: Player): boolean {
    const user = this.authService.currentUser();
    const userData = this.authService.userData();
    const fbUid = user?.uid;
    const mongoId = userData?._id || userData?.id;

    if (!p.user_id) return false;
    const pUserIdStr = String(p.user_id).trim();

    return (fbUid !== undefined && fbUid !== null && pUserIdStr === String(fbUid).trim()) ||
           (mongoId !== undefined && mongoId !== null && pUserIdStr === String(mongoId).trim());
  }

  constructor() {
    super();
    addIcons({
      addOutline, filterOutline, personOutline, shieldOutline,
      searchOutline, trashOutline, createOutline, personAddOutline,
      optionsOutline, flagOutline, chevronForwardOutline, calendarOutline,
      settingsOutline, closeCircleOutline, closeCircle, chevronBackOutline, eyeOutline,
      alertCircleOutline, checkmarkCircleOutline, checkmarkCircle, happyOutline, heart,
      thumbsUpOutline, sadOutline, peopleOutline, homeOutline, closeOutline
    });
  }

  pageTitle = 'Universo de Jugadores';
  pageSubtitle = 'Explora la base de datos completa de futbolistas';
  breadcrumbs = [
    { label: '', url: '/home', icon: 'home-outline' },
    { label: 'Universo de jugadores', url: '' },
  ];

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadPlayers();
  }

  loadPlayers(event?: { target: { complete: () => void } }) {
    if (!event) this.isLoading.set(true);

    this.playerService.getAllPlayers().subscribe({
      next: (data) => {
        this._allPlayers.set(data);
        this.totalPlayersCount.set(data.length);
        this.isLoading.set(false);
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading.set(false);
        if (event) event.target.complete();
      }
    });
  }
}
