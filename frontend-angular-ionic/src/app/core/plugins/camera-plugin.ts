import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraPhoto, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class CameraPlugin {
  /**
   * Toma una foto usando la cámara del dispositivo
   */
  async takePhoto(): Promise<CameraPhoto | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt // Permite elegir entre Cámara o Galería
      });
      return image.base64String ? image : null;
    } catch (error: any) {
      // Ignorar advertencias si el usuario simplemente canceló la selección
      if (error?.message?.includes('cancel') || error?.message?.includes('Cancel')) {
        console.log('[CAMERA] Selección de foto cancelada por el usuario.');
      } else {
        console.error('Error al tomar la foto:', error);
      }
      return null;
    }
  }

  /**
   * Consulta si el permiso de cámara está concedido
   */
  async isCameraPermissionGranted(): Promise<boolean> {
    const cameraPerm = await Camera.checkPermissions();
    return cameraPerm.camera === 'granted';
  }

  /**
   * Solicita permiso de cámara al usuario
   */
  async requestCameraPermission(): Promise<boolean> {
    const cameraPerm = await Camera.requestPermissions({ permissions: ['camera'] });
    return cameraPerm.camera === 'granted';
  }

  /**
   * Fallback para Web si el plugin nativo falla o no está disponible
   */
  async takePhotoWithFallback(): Promise<string | null> {
    try {
      const photo = await this.takePhoto();
      if (photo && photo.webPath) {
        return photo.webPath;
      }

      // Si no se obtuvo foto (por falta de hardware o de plugin) y estamos en navegador web:
      if (Capacitor.getPlatform() === 'web') {
        console.log('[CAMERA] Fallback web activo: abriendo selector de archivos.');
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (event: any) => {
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e: any) => resolve(e.target.result);
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }
      return null;
    } catch (fallbackError) {
      console.error('Error en fallback de cámara:', fallbackError);
      return null;
    }
  }
}
