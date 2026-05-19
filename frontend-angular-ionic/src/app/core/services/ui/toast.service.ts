import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastController = inject(ToastController);

  constructor() {
    // Registro los iconos correspondientes a los avisos para que estén disponibles
    addIcons({
      checkmarkCircleOutline,
      alertCircleOutline
    });
  }

  /**
   * Muestro un aviso de éxito en la parte superior de la pantalla
   */
  async showSuccess(message: string, duration: number = 2000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      cssClass: 'toast-success',
      icon: 'checkmark-circle-outline',
      buttons: [{ role: 'cancel' }]
    });
    await toast.present();
  }

  /**
   * Muestro un aviso de error en la parte superior de la pantalla
   */
  async showError(message: string, duration: number = 4000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      cssClass: 'toast-error',
      icon: 'alert-circle-outline',
      buttons: [{ role: 'cancel' }]
    });
    await toast.present();
  }
}
