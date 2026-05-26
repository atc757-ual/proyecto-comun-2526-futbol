import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, logoLinkedin, logoGithub } from 'ionicons/icons';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { PageFooterComponent } from '../layout-elements/page-footer/page-footer.component';

@Component({
  selector: 'app-layout-auth',
  templateUrl: './layout-auth.component.html',
  styleUrls: ['./layout-auth.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, PageFooterComponent]
})
export class LayoutAuthComponent {
  public layoutService = inject(LayoutService);
  public platformService = inject(PlatformService);

  constructor() {
    addIcons({ arrowBack, logoLinkedin, logoGithub });
  }
}
