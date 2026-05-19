import { Component, Input, inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalController, IonIcon, IonButton, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, pinOutline, locationOutline, closeOutline, shieldCheckmarkOutline, sparklesOutline, fingerPrintOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';

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
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  @Input() mode: PermissionMode = 'commenting';

  locationAccepted = false;
  cameraAccepted = false;
  isLoadingLocation = false;
  isLoadingCamera = false;

  constructor() {
    // Registro los iconos requeridos para que estén disponibles en el modal
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
        // Compruebo de forma inicial el acceso a la geolocalización
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' as any });
        this.locationAccepted = geoStatus.state === 'granted';

        // Compruebo el acceso a la cámara
        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' as any });
          this.cameraAccepted = camStatus.state === 'granted';
        } catch (e) {
          // Fallback: usar mediaDevices si la Permissions API no soporta 'camera'
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

  /**
   * Cierro el modal enviando los estados de permisos combinados
   */
  dismiss(accepted: boolean = false) {
    this.modalCtrl.dismiss(accepted || this.locationAccepted || this.cameraAccepted);
  }

  /**
   * Solicito acceso a la geolocalización robusta
   */
  async requestLocation() {
    this.isLoadingLocation = true;
    this.cdr.detectChanges();

    try {
      // 1. Invoco el diálogo nativo del navegador
      navigator.geolocation.getCurrentPosition(
        () => { /* Procesado en la escucha de cambio */ },
        () => { /* Procesado en la escucha de cambio */ },
        { timeout: 15000 }
      );

      // 2. Escucho el cambio de estado mediante la API de permisos
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as any });

          if (status.state === 'prompt') {
            await new Promise<void>((resolve) => {
              const onChange = () => {
                status.removeEventListener('change', onChange);
                resolve();
              };
              status.addEventListener('change', onChange);
              setTimeout(resolve, 15000);
            });
          }
          
          const finalStatus = await navigator.permissions.query({ name: 'geolocation' as any });
          await this.finishLocationRequest(finalStatus.state === 'granted');
          return;
        } catch (e) {
          // Fallback en caso de error en el query
        }
      }

      // 3. Fallback de retardo para navegadores heredados
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigator.geolocation.getCurrentPosition(
        async () => await this.finishLocationRequest(true),
        async () => await this.finishLocationRequest(false),
        { timeout: 5000 }
      );

    } catch (error) {
      console.error('[MODAL-PERMISOS] Error geolocalización:', error);
      await this.finishLocationRequest(false);
    }
  }

  /**
   * Solicito acceso a la cámara y galería multimedia
   */
  async requestCamera() {
    this.isLoadingCamera = true;
    this.cdr.detectChanges();

    try {
      if (navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        this.ngZone.run(async () => {
          this.cameraAccepted = true;
          this.isLoadingCamera = false;
          await this.toastService.showSuccess('Cámara activada con éxito');
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

  // === FUNCIONES DE SOPORTE ===

  /**
   * Finalizo el procesamiento de estado de la geolocalización
   */
  private async finishLocationRequest(accepted: boolean) {
    this.ngZone.run(async () => {
      this.locationAccepted = accepted;
      this.isLoadingLocation = false;
      if (accepted) {
        await this.toastService.showSuccess('Ubicación activada con éxito');
      }
      this.cdr.detectChanges();
    });
  }
}
