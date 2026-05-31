import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { addIcons } from 'ionicons';
import {
  personOutline, timeOutline, keyOutline,
  shieldCheckmarkOutline, logOutOutline, serverOutline,
  closeOutline, homeOutline, cafeOutline, logoNodejs
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonIcon,
  IonLabel, IonSpinner, IonBadge, IonButton, IonToggle,
  ActionSheetController, ModalController, NavController
} from '@ionic/angular/standalone';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { Auth } from '@angular/fire/auth';
import { ConfirmModalComponent } from '../../shared/components/modals/confirm-modal/confirm-modal.component';
import { PageFullContentComponent } from 'src/app/shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from 'src/app/shared/components/layout/layout-elements/page-footer/page-footer.component';
import { IonContent } from '@ionic/angular/standalone';
import { LoggerService } from '../../core/services/system/logger.service';
type ProfileUserInfo = {
  name: string;
  email: string;
  avatar: string;
  lastLogin: string;
  role: string;
};

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonIcon,
    IonLabel, IonSpinner, IonBadge, IonButton, IonToggle,
    PageFullContentComponent, PageFooterComponent, IonContent
  ]
})
export class ProfilePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly auth = inject(Auth);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly modalCtrl = inject(ModalController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService);
  private readonly navCtrl = inject(NavController);
  public platformService = inject(PlatformService);

  private readonly fallbackAvatar = 'https://ui-avatars.com/api/?name=User&background=e2e8f0&color=0f172a&bold=true';
  public useSpringBoot = false;
  public isSendingReset = false;
  public resetCooldown = false;

  constructor() {
    addIcons({
      personOutline, timeOutline, keyOutline,
      shieldCheckmarkOutline, logOutOutline, serverOutline,
      closeOutline, cafeOutline, logoNodejs
    });
  }

  public pageTitle: string = 'Mi Perfil';
  public pageSubtitle: string = 'Configuración y seguridad de cuenta';
  public breadcrumbs: any[] = [
    { label: '', url: '/', icon: 'home-outline' },
    { label: 'Mi Perfil', url: '/profile' }
  ];

  ngOnInit() {
    this.checkResetCooldown();
    this.useSpringBoot = this.platformService.getUseJavaBackend();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isMaster(): boolean {
    return this.authService.isAdmin() || this.authService.isMasterAdmin();
  }

  get isMasterAdmin(): boolean {
    return this.authService.isMasterAdmin();
  }

  get currentUserInfo(): ProfileUserInfo {
    const fireUser = this.auth.currentUser;
    const dbUser = this.authService.userData();

    const name = this.capitalizeWords(dbUser?.name || 'Usuario');
    return {
      name,
      email: fireUser?.email || '',
      avatar: `https://ui-avatars.com/api/?name=${name}&background=e2e8f0&color=0f172a&bold=true`,
      lastLogin: this.formatLastLogin(fireUser?.metadata?.lastSignInTime),
      role: this.isAdmin ? 'Administrador' : 'Usuario'
    };
  }

  async toggleBackend() {
    const targetVal = !this.platformService.getUseJavaBackend();

    // 1. Sincronizar primero con el nuevo backend para obtener su JWT de forma atómica
    try {
      await this.authService.syncUserWithBackend(targetVal, true);
    } catch (err) {
      this.logger.error('[PROFILE] Error de sincronización al cambiar backend:', err);
      // Revertir el toggle visualmente: restaurar el valor anterior y forzar detección de cambios
      this.useSpringBoot = this.platformService.getUseJavaBackend();
      this.cdr.detectChanges();
      await this.toastService.showError(`No se pudo cambiar al backend ${targetVal ? 'Java' : 'Node'}.`, 3500);
      return;
    }

    // 2. Hacer el cambio efectivo del BehaviorSubject en el PlatformService
    this.platformService.toggleBackend();
    this.useSpringBoot = this.platformService.getUseJavaBackend();
    const newVal = this.useSpringBoot;

    await this.toastService.showSuccess(`Backend cambiado a ${newVal ? 'Java' : 'Node'} al instante`);

    // 3. navigateRoot limpia el stack de Ionic y fuerza reinicializacion del home
    await this.navCtrl.navigateRoot('/home', { animated: false });
  }

  async sendPasswordReset() {
    const email = this.currentUserInfo.email;
    if (!email || this.isSendingReset || this.resetCooldown) return;
    this.isSendingReset = true;
    try {
      await this.authService.sendResetPasswordEmail(email);
      await this.toastService.showSuccess('¡Enlace enviado! Revisa tu bandeja de entrada.', 5000);
      this.startCooldown(5 * 60 * 1000);
    } catch {
      await this.toastService.showError('Error al enviar el enlace.', 3000);
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

  openNodeStatusDashboard() {
    const token = localStorage.getItem('jwt_token');
    const base = environment.nodeApiUrl.replace(/\/(node-api|api)\/?$/, '');
    const url = token ? `${base}/status?token=${token}` : `${base}/status`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  handleAvatarError(event: any) {
    event.target.onerror = null;
    event.target.src = this.fallbackAvatar;
  }

  private formatLastLogin(lastSignInTime?: string | null): string {
    if (!lastSignInTime) {
      return 'Desconocido';
    }

    const date = new Date(lastSignInTime);
    return date.toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private capitalizeWords(value: string): string {
    return value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

