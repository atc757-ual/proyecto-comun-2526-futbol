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
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt // Permite elegir entre Cámara o Galería
      });
      return image.webPath ? image : null;
    } catch (error) {
      console.error('Error al tomar la foto:', error);
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
      return photo ? photo.webPath! : null;
    } catch (error) {
      if (Capacitor.getPlatform() === 'web') {
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
    }
  }
}
