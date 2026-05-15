import { Component, Input, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalController, ToastController, IonIcon, IonButton, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, pinOutline, locationOutline, closeOutline, shieldCheckmarkOutline, sparklesOutline, fingerPrintOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

export type PermissionMode = 'players' | 'commenting';

@Component({
  selector: 'app-permission-modal',
  templateUrl: './permission-modal.component.html',
  styleUrls: ['./permission-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton, IonSpinner]
})
export class PermissionModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  public authService = inject(AuthService);

  @Input() mode: PermissionMode = 'commenting';

  locationAccepted = false;
  cameraAccepted = false;
  isLoadingLocation = false;
  isLoadingCamera = false;

  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({
      cameraOutline,
      pinOutline,
      locationOutline,
      closeOutline,
      shieldCheckmarkOutline,
      sparklesOutline,
      fingerPrintOutline,
      checkmarkCircleOutline
    });
  }

  async ngOnInit() {
    console.log('[MODAL-PERMISOS] ngOnInit iniciado. Modo:', this.mode);
    try {
      if (navigator.permissions) {
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' as any });
        this.locationAccepted = geoStatus.state === 'granted';
        console.log('[MODAL-PERMISOS] Estado Geolocation inicial:', geoStatus.state);
      }
    } catch (error) {
      console.warn('[MODAL-PERMISOS] Error verificando permisos iniciales:', error);
    }
    console.log('[MODAL-PERMISOS] ngOnInit finalizado.');
  }

  dismiss(accepted: boolean = false) {
    this.modalCtrl.dismiss(accepted || this.locationAccepted || this.cameraAccepted);
  }

  /**
   * Manejadores para los Toggles
   */
  handleToggleLocation(ev: any) {
    const isChecked = ev.detail.checked;
    if (isChecked && !this.locationAccepted) {
      this.requestLocation();
    } else {
      this.locationAccepted = isChecked;
    }
  }

  handleToggleCamera(ev: any) {
    const isChecked = ev.detail.checked;
    if (isChecked && !this.cameraAccepted) {
      this.requestCamera();
    } else {
      this.cameraAccepted = isChecked;
    }
  }

  /**
   * Petición individual de Ubicación
   */
  async requestLocation() {
    this.isLoadingLocation = true;
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.locationAccepted = true;
          this.isLoadingLocation = false;
          this.showSuccessToast('Ubicación activada con éxito');
          this.cdr.detectChanges();
        },
        (err) => {
          console.warn('Error al obtener ubicación:', err);
          this.locationAccepted = false;
          this.isLoadingLocation = false;
          this.cdr.detectChanges();
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } catch (error) {
      console.error('Error GPS:', error);
      this.locationAccepted = false;
      this.isLoadingLocation = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Petición individual de Cámara
   */
  async requestCamera() {
    this.isLoadingCamera = true;
    try {
      if (navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        this.cameraAccepted = true;
        this.isLoadingCamera = false;
        this.showSuccessToast('Cámara activada con éxito');
        this.cdr.detectChanges();
      } else {
        this.isLoadingCamera = false;
      }
    } catch (error) {
      console.error('Error Cámara:', error);
      this.cameraAccepted = false;
      this.isLoadingCamera = false;
      this.cdr.detectChanges();
    }
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      mode: 'ios',
      cssClass: 'toast-success',
      buttons: [
        {
          icon: 'checkmark-circle-outline',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
