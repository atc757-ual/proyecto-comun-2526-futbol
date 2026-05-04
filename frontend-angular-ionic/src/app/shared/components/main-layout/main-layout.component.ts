import { Component, Input } from '@angular/core';
import { 
  IonMenu, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, 
  IonLabel, IonHeader, IonToolbar, IonButtons, IonMenuButton, 
  IonTabBar, IonTabButton, IonFooter, IonButton 
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  footballOutline, personOutline, logOutOutline, settingsOutline,
  starOutline, calendarOutline, trophyOutline, statsChartOutline, 
  gridOutline, closeOutline, homeOutline, clipboardOutline, 
  cashOutline, helpCircleOutline, cartOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, IonMenu, 
    IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, 
    IonHeader, IonToolbar, IonButtons, IonMenuButton, 
    IonTabBar, IonTabButton, IonFooter, IonButton
  ]
})
export class MainLayoutComponent {
  @Input() title: string = 'Football App';

  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home' },
    { title: 'Partidos', url: '/partidos', icon: 'football' },
    { title: 'Estadísticas', url: '/estadisticas', icon: 'stats-chart' },
    { title: 'Perfil', url: '/perfil', icon: 'person' },
  ];

  constructor() {
    addIcons({ 
      footballOutline, personOutline, logOutOutline, settingsOutline,
      starOutline, calendarOutline, trophyOutline, statsChartOutline, 
      gridOutline, closeOutline, homeOutline, clipboardOutline, 
      cashOutline, helpCircleOutline, cartOutline
    });
  }

  logout() {
    console.log('Cerrando sesión...');
    // Aquí iría la lógica con AuthService
  }
}
