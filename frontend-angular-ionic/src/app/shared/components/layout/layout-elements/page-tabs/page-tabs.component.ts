import { Component, inject } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonFooter, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline
} from 'ionicons/icons';
import { NavigationService } from 'src/app/core/services/ui/navigation.service';

@Component({
  selector: 'app-page-tabs',
  templateUrl: './page-tabs.component.html',
  styleUrls: ['./page-tabs.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonFooter, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class PageTabsComponent {
  public navService = inject(NavigationService);

  public auth = inject(AuthService);

  constructor() {
    addIcons({ homeOutline, newspaperOutline, footballOutline, sparklesOutline, searchOutline });
  }
}
