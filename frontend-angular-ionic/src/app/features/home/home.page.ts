import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  star, calendar, trophy, statsChart, grid, person, timeOutline,
  chevronForward, football, chevronBack, newspaperOutline, settingsOutline,
  logOutOutline, keyOutline, shieldCheckmarkOutline, closeOutline,
  checkmarkCircleOutline, alertCircleOutline, personOutline, mailOutline
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/layout.service';
import { NewsService } from 'src/app/core/services/news.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit {
  private newsService = inject(NewsService);
  private router = inject(Router);
  private layoutService = inject(LayoutService);

  featuredNews: any[] = [];
  isLoadingFeatured = true;

  constructor() {
    addIcons({
      star, calendar, trophy, mailOutline,
      statsChart, grid, person, timeOutline,
      chevronForward, football, shieldCheckmarkOutline,
      chevronBack, newspaperOutline, settingsOutline,
      logOutOutline, keyOutline, personOutline,
      closeOutline, checkmarkCircleOutline, alertCircleOutline
    });
  }

  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit() {
    this.checkResetCooldown();
    this.loadFeaturedNews();

    // Configurar Layout para la Home
    this.layoutService.setHeader({
      title: `Hola, ${this.authService.firstName() || 'Usuario'}!`,
      subtitle: 'Toda la emoción del fútbol en tu mano',
      showHero: true,
      isHome: true
    });

    // Limpiar breadcrumbs al volver a Home
    this.layoutService.setBreadcrumbs([]);
  }

  private auth = inject(Auth);

  get currentUserInfo() {
    const fireUser = this.auth.currentUser;
    const dbUser = this.authService.userData();

    // Formatear la fecha de última sesión
    let lastLoginFormatted = 'Desconocido';
    if (fireUser?.metadata?.lastSignInTime) {
      const date = new Date(fireUser.metadata.lastSignInTime);
      lastLoginFormatted = date.toLocaleString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }

    const name = dbUser?.name || 'Usuario';
    return {
      name: name,
      email: fireUser?.email || '',
      avatar: `https://ui-avatars.com/api/?name=${name}&background=e2e8f0&color=0f172a&bold=true`,
      lastLogin: lastLoginFormatted,
      role: this.isAdmin ? 'Administrador' : 'Usuario'
    };
  }

  loadFeaturedNews() {
    this.isLoadingFeatured = true;
    this.newsService.getFeatured().subscribe({
      next: (news) => {
        this.featuredNews = news.map(item => ({
          id: item.id,
          title: item.title,
          excerpt: item.summary,
          author: item.author,
          date: item.date,
          image: item.imageUrl
        }));
        console.log('Noticias destacadas cargadas:', this.featuredNews.length);
        this.isLoadingFeatured = false;
      },
      error: (err) => {
        console.error('Error cargando destacadas:', err);
        this.isLoadingFeatured = false;
      }
    });
  }

  goToNewsDetail(news: any) {
    this.router.navigate(['/news', news.id]);
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir de tu cuenta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.authService.logout().then(() => this.router.navigate(['/login']));
          }
        }
      ]
    });
    await alert.present();
  }

  public isSendingReset = false;
  public resetCooldown = false;

  async sendPasswordReset() {
    const email = this.currentUserInfo.email;
    if (!email || this.isSendingReset || this.resetCooldown) return;

    this.isSendingReset = true;
    try {
      await this.authService.sendResetPasswordEmail(email);

      const toast = await this.toastCtrl.create({
        message: '¡Enlace enviado! Revisa tu bandeja de entrada.',
        duration: 5000,
        position: 'top',
        cssClass: 'toast-success',
        icon: 'checkmark-circle-outline',
        mode: 'ios',
        buttons: [{ role: 'cancel', icon: 'close-outline' }]
      });
      await toast.present();

      // Iniciar cooldown
      this.startCooldown(5 * 60 * 1000);

    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: 'Error al enviar el enlace. Inténtalo más tarde.',
        duration: 3000,
        position: 'top',
        cssClass: 'toast-error',
        icon: 'alert-circle-outline',
        mode: 'ios',
        buttons: [{ role: 'cancel', icon: 'close-outline' }]
      });
      await toast.present();
    } finally {
      this.isSendingReset = false;
    }
  }

  private startCooldown(duration: number) {
    this.resetCooldown = true;
    const cooldownEnd = Date.now() + duration;
    localStorage.setItem('reset_cooldown_end', cooldownEnd.toString());

    setTimeout(() => {
      this.resetCooldown = false;
      localStorage.removeItem('reset_cooldown_end');
    }, duration);
  }

  private checkResetCooldown() {
    const cooldownEnd = localStorage.getItem('reset_cooldown_end');
    if (cooldownEnd) {
      const remaining = parseInt(cooldownEnd) - Date.now();
      if (remaining > 0) {
        this.resetCooldown = true;
        setTimeout(() => {
          this.resetCooldown = false;
          localStorage.removeItem('reset_cooldown_end');
        }, remaining);
      } else {
        localStorage.removeItem('reset_cooldown_end');
      }
    }
  }

  handleAvatarError(event: any) {
    event.target.src = 'https://ui-avatars.com/api/?name=User&background=e2e8f0&color=0f172a&bold=true';
  }
}
