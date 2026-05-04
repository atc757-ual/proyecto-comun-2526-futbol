import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  starOutline, calendarOutline, trophyOutline, 
  statsChartOutline, gridOutline, person, 
  chevronForwardOutline, footballOutline 
} from 'ionicons/icons';
import { MainLayoutComponent } from '../../shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, MainLayoutComponent]
})
export class HomePage {

  constructor() {
    addIcons({ 
      starOutline, calendarOutline, trophyOutline, 
      statsChartOutline, gridOutline, person, 
      chevronForwardOutline, footballOutline 
    });
  }

}
