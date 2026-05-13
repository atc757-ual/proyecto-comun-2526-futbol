import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonIcon, IonContent,
  IonBackButton, IonBreadcrumbs, IonBreadcrumb
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline, football, personOutline, sparklesOutline, footballOutline, 
  logoLinkedin, personCircleOutline, logoGithub, closeOutline, 
  arrowBack, chevronBack, chevronForwardOutline, personAddOutline
} from 'ionicons/icons';
import { PlatformService } from 'src/app/core/services/platform.service';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-public-layout',
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent, IonIcon,
    IonBackButton, IonBreadcrumbs,
    IonBreadcrumb
  ]
})
export class PublicLayoutComponent implements OnInit {
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);

  constructor() {
    addIcons({
      menuOutline, footballOutline, personCircleOutline, personAddOutline,
      personOutline, sparklesOutline, logoLinkedin, logoGithub, closeOutline, 
      arrowBack, chevronBack, chevronForwardOutline, football
    });
  }

  ngOnInit() {
    console.log('PublicLayout loaded');
  }
}
