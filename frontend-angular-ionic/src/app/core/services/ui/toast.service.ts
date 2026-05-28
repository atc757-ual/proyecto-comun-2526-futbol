import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, alertCircleOutline, warningOutline } from 'ionicons/icons';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private readonly toastController: ToastController) {
    // Registro los iconos correspondientes a los avisos para que estén disponibles
    addIcons({
      checkmarkCircleOutline,
      alertCircleOutline,
      warningOutline
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

  /**
  * Muestro un aviso de error en la parte superior de la pantalla
  */
  async showWarning(message: string, duration: number = 4000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      cssClass: 'toast-warning',
      icon: 'warning-outline',
      buttons: [{ role: 'cancel' }]
    });
    await toast.present();
  }
}
