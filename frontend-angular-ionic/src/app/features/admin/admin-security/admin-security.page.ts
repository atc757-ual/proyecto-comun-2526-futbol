import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonItem, IonLabel, IonIcon, IonBadge, 
  IonButton, IonSpinner, IonList, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  shieldCheckmarkOutline, shieldOutline, keyOutline, 
  fingerPrintOutline, refreshOutline, alertCircleOutline, personAddOutline 
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-admin-security',
  templateUrl: './admin-security.page.html',
  styleUrls: ['./admin-security.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, IonItem, IonLabel, IonIcon, IonBadge, 
    IonButton, IonList, IonInput, IonSpinner
  ]
})
export class AdminSecurityPage implements OnInit {
  public authService = inject(AuthService);
  private auth = inject(Auth);

  public isLoading = signal(false);
  public firebaseClaims = signal<any>(null);
  public backendIsAdmin = signal<boolean>(false);
  public lastChecked = signal<Date | null>(null);
  public targetEmail = signal<string>('');
  public isPromoting = signal<boolean>(false);

  constructor() {
    addIcons({ 
      shieldCheckmarkOutline, shieldOutline, keyOutline, 
      fingerPrintOutline, refreshOutline, alertCircleOutline, personAddOutline 
    });
  }

  ngOnInit() {
    this.checkSecurityStatus();
  }

  async checkSecurityStatus() {
    this.isLoading.set(true);
    
    try {
      // 1. Verificar Claims de Firebase (Seguridad nativa)
      const user = this.auth.currentUser;
      if (user) {
        const tokenResult = await user.getIdTokenResult(true); // Forzar refresco para ver cambios del script
        this.firebaseClaims.set(tokenResult.claims);
      }

      // 2. Verificar Rol del Backend (Seguridad de nuestra API)
      this.backendIsAdmin.set(this.authService.isAdmin());

      this.lastChecked.set(new Date());
    } catch (error) {
      console.error('Error al verificar seguridad:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  get claimStatus() {
    return this.firebaseClaims()?.admin === true ? 'ACTIVO' : 'NO DETECTADO';
  }

  async promoteUser() {
    const email = this.targetEmail();
    if (!email || !email.includes('@')) return;

    this.isPromoting.set(true);
    try {
      await this.authService.promoteUserToAdmin(email);
      alert(`Usuario ${email} promovido exitosamente.`);
      this.targetEmail.set('');
      this.checkSecurityStatus();
    } catch (error: any) {
      alert('Error: ' + (error.error?.result?.descriptionDetail || error.message));
    } finally {
      this.isPromoting.set(false);
    }
  }

  async promoteSelf() {
    const email = this.auth.currentUser?.email;
    if (email) {
      this.targetEmail.set(email);
      await this.promoteUser();
    }
  }
}
