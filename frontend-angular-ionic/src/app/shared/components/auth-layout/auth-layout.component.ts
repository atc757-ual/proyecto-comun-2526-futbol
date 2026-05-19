import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, logoLinkedin, logoGithub } from 'ionicons/icons';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class AuthLayoutComponent {
  public layoutService = inject(LayoutService);
  public platformService = inject(PlatformService);

  constructor() {
    addIcons({ arrowBack, logoLinkedin, logoGithub });
  }
}
