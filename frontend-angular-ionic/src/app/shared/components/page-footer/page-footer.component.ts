import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { logoGithub, logoLinkedin } from 'ionicons/icons';
import { addIcons } from 'ionicons';
@Component({
  selector: 'app-page-footer',
  templateUrl: './page-footer.component.html',
  styleUrls: ['./page-footer.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class PageFooterComponent {
  public platformService = inject(PlatformService);

  constructor() {
    addIcons({ logoGithub, logoLinkedin });
  }
}
