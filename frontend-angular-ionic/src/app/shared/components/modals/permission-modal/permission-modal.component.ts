import { Component, Input, inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalController, IonIcon, IonButton, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, pinOutline, locationOutline, closeOutline, shieldCheckmarkOutline, sparklesOutline, fingerPrintOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { LocationPlugin } from 'src/app/core/plugins/location-plugin';
import { LoggerService } from '../../../../core/services/system/logger.service';
export type PermissionMode = 'players' | 'commenting';

@Component({
  selector: 'app-permission-modal',
  templateUrl: './permission-modal.component.html',
  styleUrls: ['./permission-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton, IonSpinner]

})
export class PermissionModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  public authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly locationPlugin = inject(LocationPlugin);
  private readonly logger = inject(LoggerService);

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
      // Usar LocationPlugin que maneja correctamente web y nativo (Capacitor/Android)
      this.locationAccepted = await this.locationPlugin.isGeolocationPermissionGranted();

      // Comprobar permiso de cámara (solo disponible via web API)
      try {
        const camStatus = await navigator.permissions.query({ name: 'camera' as any });
        this.cameraAccepted = camStatus.state === 'granted';
      } catch (e) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          this.cameraAccepted = devices.some(d => d.kind === 'videoinput' && d.label !== '');
        } catch {
          this.cameraAccepted = false;
        }
      }
    } catch (error) {
      this.logger.warn('[MODAL-PERMISOS] Error verificando permisos iniciales:', error);
    }
  }

  /**
   * Cierro el modal enviando los estados de permisos combinados
   */
  dismiss(accepted: boolean = false) {
    this.modalCtrl.dismiss(accepted || this.locationAccepted || this.cameraAccepted);
  }

  /**
   * Solicita acceso a la geolocalización usando LocationPlugin,
   * que maneja correctamente la plataforma web y nativa (Android/iOS vía Capacitor).
   * En Android, el evento 'change' de navigator.permissions no es fiable en WebView,
   * por eso delegamos en el plugin que usa Geolocation.requestPermissions() de Capacitor.
   */
  async requestLocation() {
    this.isLoadingLocation = true;
    this.cdr.detectChanges();

    try {
      const granted = await this.locationPlugin.requestGeolocationPermission();
      await this.finishLocationRequest(granted);
    } catch (error) {
      this.logger.error('[MODAL-PERMISOS] Error geolocalización:', error);
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
