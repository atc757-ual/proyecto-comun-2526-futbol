import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, timeOutline, keyOutline,
  shieldCheckmarkOutline, logOutOutline, serverOutline,
  checkmarkCircleOutline, alertCircleOutline, closeOutline, chevronForward,
  key, homeOutline, cafeOutline, logoNodejs
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonIcon,
  IonLabel, IonSpinner, IonBadge, IonButton, IonToggle,
  ToastController, AlertController, ActionSheetController, ModalController
} from '@ionic/angular/standalone';
import { LayoutService } from 'src/app/core/services/layout.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { Auth } from '@angular/fire/auth';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonIcon,
    IonLabel, IonSpinner, IonBadge, IonButton, IonToggle
  ]
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private auth = inject(Auth);
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private modalCtrl = inject(ModalController);
  public platformService = inject(PlatformService);

  public useSpringBoot = false;
  public isSendingReset = false;
  public resetCooldown = false;

  constructor() {
    addIcons({
      personOutline, mailOutline, timeOutline, keyOutline,
      shieldCheckmarkOutline, logOutOutline, serverOutline,
      checkmarkCircleOutline, alertCircleOutline, closeOutline, chevronForward,
      key, cafeOutline, logoNodejs
    });
  }

  ngOnInit() {
    this.layoutService.setHeader({
      title: 'Mi Perfil',
      subtitle: 'Configuración y seguridad de cuenta',
      showHero: true
    });
    this.layoutService.setBreadcrumbs([
      { label: '', url: '/', icon: 'home-outline' },
      { label: 'Mi Perfil', url: '/profile' }
    ]);

    this.checkResetCooldown();
    this.useSpringBoot = this.platformService.getUseJavaBackend();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isMaster(): boolean {
    return this.authService.isAdmin() || this.authService.isMasterAdmin();
  }

  get currentUserInfo() {
    const fireUser = this.auth.currentUser;
    const dbUser = this.authService.userData();

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

  async toggleBackend() {
    this.platformService.toggleBackend();
    this.useSpringBoot = this.platformService.getUseJavaBackend();
    const newVal = this.useSpringBoot;

    const toast = await this.toastCtrl.create({
      message: `Backend cambiado a ${newVal ? 'Java' : 'Node'} al instante`,
      duration: 2000,
      position: 'top',
      cssClass: newVal ? 'toast-primary' : 'toast-success',
      color: newVal ? 'primary' : 'success',
      icon: 'checkmark-circle-outline',
      mode: 'ios',
      buttons: [{ role: 'cancel', icon: 'close-outline' }]
    });
    await toast.present();
  }

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
      this.startCooldown(5 * 60 * 1000);
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: 'Error al enviar el enlace.',
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

  async confirmLogout() {
    if (this.platformService.isDesktop) {
      const modal = await this.modalCtrl.create({
        component: ConfirmModalComponent,
        cssClass: 'premium-modal',
        componentProps: {
          title: 'Cerrar Sesión',
          message: '¿Estás seguro de que deseas salir de tu cuenta? Tendrás que volver a entrar con tus credenciales.',
          confirmText: 'Sí, cerrar sesión',
          cancelText: 'No, cancelar',
          type: 'logout'
        }
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (data === true) {
        this.authService.logout().then(() => this.router.navigate(['/login']));
      }
    } else {
      const actionSheet = await this.actionSheetCtrl.create({
        header: '¿Deseas cerrar sesión?',
        subHeader: 'Tendrás que volver a entrar con tus credenciales',
        mode: 'ios',
        cssClass: 'custom-logout-action-sheet',
        buttons: [
          {
            text: 'Cerrar Sesión',
            role: 'destructive',
            icon: 'log-out-outline',
            handler: () => {
              this.authService.logout().then(() => this.router.navigate(['/login']));
            }
          },
          { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
        ]
      });

      await actionSheet.present();
    }
  }

  handleAvatarError(event: any) {
    event.target.onerror = null;
    event.target.src = 'https://ui-avatars.com/api/?name=User&background=e2e8f0&color=0f172a&bold=true';
  }
}
