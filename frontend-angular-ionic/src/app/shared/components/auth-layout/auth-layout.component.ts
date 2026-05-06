import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonIcon } from '@ionic/angular/standalone';
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
  imports: [CommonModule, RouterModule, IonIcon]
})
export class AuthLayoutComponent implements OnInit {
  authTitle: string = 'Título';
  authSubtitle: string = 'Subtítulo del formulario';
  showBackButton: boolean = false;
  backHref: string = '/auth/login';
  isLogin: boolean = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      footballOutline, lockClosedOutline, personOutline,
      logoLinkedin, logoGithub, arrowBackOutline
    });
  }

  ngOnInit() {
    this.updateData();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateData();
    });
  }

  private updateData() {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.data;
    if (data && Object.keys(data).length > 0) {
      if (data['authTitle']) this.authTitle = data['authTitle'];
      if (data['authSubtitle']) this.authSubtitle = data['authSubtitle'];
      this.showBackButton = data['showBackButton'] || false;
      this.backHref = data['backHref'] || '/auth/login';
      this.isLogin = data['isLogin'] || false;

      this.cdr.detectChanges();
    }
  }
}
