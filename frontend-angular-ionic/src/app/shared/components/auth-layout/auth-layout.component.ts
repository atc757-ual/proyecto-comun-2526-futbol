import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { 
  footballOutline, lockClosedOutline, personOutline, 
  logoLinkedin, logoGithub, arrowBackOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonContent, IonIcon]
})
export class AuthLayoutComponent {
  @Input() authTitle: string = 'Título';
  @Input() authSubtitle: string = 'Subtítulo del formulario';
  @Input() showBackButton: boolean = false;
  @Input() backHref: string = '/login';

  constructor() {
    addIcons({ 
      footballOutline, lockClosedOutline, personOutline, 
      logoLinkedin, logoGithub, arrowBackOutline 
    });
  }
}
