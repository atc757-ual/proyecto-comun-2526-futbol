import { Component, Input, inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
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
  private ngZone = inject(NgZone);

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
    try {
      if (navigator.permissions) {
        // Comprobar estado de geolocalización
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' as any });
        this.locationAccepted = geoStatus.state === 'granted';

        // Comprobar estado de cámara
        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' as any });
          this.cameraAccepted = camStatus.state === 'granted';
        } catch (e) {
          // Fallback: intentar con mediaDevices si la Permissions API no soporta 'camera'
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameraAccepted = devices.some(d => d.kind === 'videoinput' && d.label !== '');
          } catch {
            this.cameraAccepted = false;
          }
        }
      }
    } catch (error) {
      console.warn('[MODAL-PERMISOS] Error verificando permisos iniciales:', error);
    }
  }

  dismiss(accepted: boolean = false) {
    this.modalCtrl.dismiss(accepted || this.locationAccepted || this.cameraAccepted);
  }

  /**
   * Petición de Ubicación robusta.
   * Esperamos explícitamente a que el estado deje de ser 'prompt'.
   */
  async requestLocation() {
    this.isLoadingLocation = true;
    this.cdr.detectChanges();

    try {
      // 1. Disparamos el prompt del navegador
      navigator.geolocation.getCurrentPosition(
        () => { /* Se maneja en la lógica de estado abajo */ },
        () => { /* Se maneja en la lógica de estado abajo */ },
        { timeout: 15000 }
      );

      // 2. Intentamos usar la Permissions API para esperar el cambio
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as any });

          if (status.state === 'prompt') {
            // Esperamos a que cambie (el usuario haga clic)
            await new Promise<void>((resolve) => {
              const onChange = () => {
                status.removeEventListener('change', onChange);
                resolve();
              };
              status.addEventListener('change', onChange);
              // Timeout de seguridad por si el diálogo se cierra o falla
              setTimeout(resolve, 15000);
            });
          }
          
          const finalStatus = await navigator.permissions.query({ name: 'geolocation' as any });
          this.finishLocationRequest(finalStatus.state === 'granted');
          return;
        } catch (e) {
          // Si falla query (algunos navegadores), vamos al fallback
        }
      }

      // 3. Fallback: Esperar un poco a que getCurrentPosition resuelva (navegadores antiguos)
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigator.geolocation.getCurrentPosition(
        () => this.finishLocationRequest(true),
        () => this.finishLocationRequest(false),
        { timeout: 5000 }
      );

    } catch (error) {
      console.error('[PermissionModal] Error:', error);
      this.finishLocationRequest(false);
    }
  }

  /**
   * Centraliza la actualización del estado de ubicación
   */
  private finishLocationRequest(accepted: boolean) {
    this.ngZone.run(() => {
      this.locationAccepted = accepted;
      this.isLoadingLocation = false;
      if (accepted) {
        this.showSuccessToast('Ubicación activada con éxito');
      }
      this.cdr.detectChanges();
    });
  }

  /**
   * Petición de Cámara
   */
  async requestCamera() {
    this.isLoadingCamera = true;
    this.cdr.detectChanges();

    try {
      if (navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        this.ngZone.run(() => {
          this.cameraAccepted = true;
          this.isLoadingCamera = false;
          this.showSuccessToast('Cámara activada con éxito');
        });
      } else {
        this.isLoadingCamera = false;
      }
    } catch (error) {
      this.ngZone.run(() => {
        this.cameraAccepted = false;
        this.isLoadingCamera = false;
      });
    }
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      mode: 'ios',
      cssClass: 'toast-success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }
}

