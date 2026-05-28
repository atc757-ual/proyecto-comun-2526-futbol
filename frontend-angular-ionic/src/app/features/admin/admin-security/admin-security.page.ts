import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonLabel, IonIcon, IonBadge,
  IonButton, IonSpinner, IonList, IonInput, ToastController, IonContent
} from '@ionic/angular/standalone';
import { PageFullContentComponent } from 'src/app/shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from 'src/app/shared/components/layout/layout-elements/page-footer/page-footer.component';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline, shieldOutline, keyOutline,
  fingerPrintOutline, refreshOutline, alertCircleOutline, personAddOutline,
  atOutline, personRemoveOutline, personCircleOutline, closeOutline, banOutline,
  checkmarkCircleOutline, serverOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { Auth } from '@angular/fire/auth';
import { LoggerService } from '../../../core/services/system/logger.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';

@Component({
  selector: 'app-admin-security',
  templateUrl: './admin-security.page.html',
  styleUrls: ['./admin-security.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonIcon, IonBadge,
    IonButton, IonList, IonInput, IonSpinner, IonContent,
    PageFullContentComponent, PageFooterComponent
  ]
})
export class AdminSecurityPage implements OnInit {
  public authService = inject(AuthService);
  private readonly auth = inject(Auth);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  public isLoading = signal(false);
  public firebaseClaims = signal<any>(null);
  public backendIsAdmin = signal<boolean>(false);
  public lastChecked = signal<Date | null>(null);
  public targetEmail: string = '';
  public isPromoting = signal<boolean>(false);
  public isTogglingStatus = signal<boolean>(false);
  public isAdmin = signal(false);
  public emailFocused = false;
  public suggestedUsers = signal<any[]>([]);
  public selectedUser = signal<any | null>(null);
  public breadcrumbs = [
    { label: '', url: '/home', icon: 'home-outline' },
    { label: 'Mi perfil', url: '/profile' },
    { label: 'Seguridad' }
  ];

  constructor() {
    // Añado reactividad: si el usuario cambia, refresco el estado de seguridad
    effect(() => {
      const user = this.authService.currentUser();
      this.isAdmin.set(this.authService.isAdmin());
      if (user) {
        this.checkSecurityStatus();
      }
    });

    addIcons({
      shieldCheckmarkOutline, shieldOutline, keyOutline,
      fingerPrintOutline, refreshOutline, alertCircleOutline, personAddOutline,
      atOutline, personRemoveOutline, personCircleOutline, closeOutline, banOutline,
      checkmarkCircleOutline, serverOutline
    });
  }

  ngOnInit() {
    this.checkSecurityStatus();
  }

  async checkSecurityStatus() {
    this.isLoading.set(true);

    try {
      // 1. Verifico claims de Firebase (seguridad nativa)
      const user = this.authService.currentUser();
      if (user) {
        // Obtengo el objeto de usuario real de Firebase para pedir su ID token
        const fbUser = this.auth.currentUser;
        if (fbUser) {
          const tokenResult = await fbUser.getIdTokenResult(true); // Fuerzo el refresco del token para reflejar cambios inmediatos
          this.firebaseClaims.set(tokenResult.claims);
          this.logger.log('[SECURITY] Claims detectados:', tokenResult.claims);
        }
      }

      // 2. Verifico el rol devuelto por el backend de nuestra API
      this.backendIsAdmin.set(this.authService.isAdmin());

      this.lastChecked.set(new Date());
    } catch (error) {
      this.logger.error('Error al verificar seguridad:', error);
    } finally {
      this.isLoading.set(false);
    }
  }


  async promoteUser() {
    const email = this.targetEmail;
    if (!email || !email.includes('@')) return;

    this.isPromoting.set(true);
    try {
      await this.authService.promoteUserToAdmin(email);
      this.toastService.showSuccess(`Usuario ${email} promovido exitosamente.`);
      this.targetEmail = '';
      this.selectedUser.set(null);
      this.checkSecurityStatus();
    } catch (error: any) {
      this.toastService.showError(this.getErrorMessage(error));
    } finally {
      this.isPromoting.set(false);
    }
  }

  async revokeUser() {
    const email = this.targetEmail;
    if (!email || !email.includes('@')) return;

    this.isPromoting.set(true);
    try {
      await this.authService.removeAdminRole(email);
      this.toastService.showSuccess(`Permisos revocados a ${email}.`);
      this.targetEmail = '';
      this.selectedUser.set(null);
      this.checkSecurityStatus();
    } catch (error: any) {
      this.toastService.showError(this.getErrorMessage(error));
    } finally {
      this.isPromoting.set(false);
    }
  }

  async toggleUserStatus(disabled: boolean) {
    const email = this.targetEmail;
    if (!email) return;

    this.isTogglingStatus.set(true);
    try {
      await this.authService.toggleUserStatus(email, disabled);
      const action = disabled ? 'inhabilitado' : 'habilitado';
      this.toastService.showSuccess(`Usuario ${action} correctamente.`);
      this.targetEmail = '';
      this.selectedUser.set(null);
      this.checkSecurityStatus();
    } catch (error: any) {
      this.toastService.showError(this.getErrorMessage(error));
    } finally {
      this.isTogglingStatus.set(false);
    }
  }

  async promoteSelf() {
    const email = this.auth.currentUser?.email;
    if (email) {
      this.targetEmail = email;
      await this.promoteUser();
    }
  }

  async onSearchInput(event: any) {
    const val = event.detail.value;
    this.logger.log('[SECURITY] Buscando:', val);
    this.selectedUser.set(null); // Limpio la selección al escribir de nuevo

    if (!val || val.length < 2) {
      this.suggestedUsers.set([]);
      return;
    }

    try {
      const response: any = await this.authService.searchUsers(val);
      this.logger.log('[SECURITY] Respuesta usuarios:', response);
      this.suggestedUsers.set(response.data || []);
    } catch (error) {
      this.logger.error('[SECURITY] Error al buscar usuarios:', error);
    }
  }

  selectUser(user: any) {
    this.logger.log('[SECURITY] Usuario seleccionado:', user);
    this.targetEmail = user.email;
    this.selectedUser.set(user);
    this.suggestedUsers.set([]);
  }

  clearSelection() {
    this.targetEmail = '';
    this.selectedUser.set(null);
    this.suggestedUsers.set([]);
  }

  private getErrorMessage(error: any): string {
    const detail = error.error?.result?.descriptionDetail || error.message || '';

    // Mapeo de errores conocidos y técnicos
    if (detail.includes('no user record corresponding')) {
      return 'El usuario no tiene una cuenta de autenticación activa.';
    }
    // Remuevo prefijos repetitivos del backend
    let cleanDetail = detail;
    if (cleanDetail.startsWith('Error al procesar la solicitud:')) {
      cleanDetail = cleanDetail.replace('Error al procesar la solicitud:', '').trim();
    }
    return cleanDetail || 'Ocurrió un error inesperado al procesar la solicitud.';
  }
}

