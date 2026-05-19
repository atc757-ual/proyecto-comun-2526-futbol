import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class HapticsPlugin {

  /**
   * Produce un impacto táctil (suave, medio, fuerte)
   */
  async impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (Capacitor.getPlatform() === 'web') return; // En web no hace nada silenciosamente
    try {
      let impactStyle = ImpactStyle.Medium;
      if (style === 'light') impactStyle = ImpactStyle.Light;
      if (style === 'heavy') impactStyle = ImpactStyle.Heavy;

      await Haptics.impact({ style: impactStyle });
    } catch (e) {
      console.warn('[HAPTICS-PLUGIN] Error al reproducir impact:', e);
    }
  }

  /**
   * Produce una vibración de notificación (Éxito, Advertencia, Error)
   */
  async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      let notifType = NotificationType.Success;
      if (type === 'warning') notifType = NotificationType.Warning;
      if (type === 'error') notifType = NotificationType.Error;

      await Haptics.notification({ type: notifType });
    } catch (e) {
      console.warn('[HAPTICS-PLUGIN] Error al reproducir notification:', e);
    }
  }

  /**
   * Vibración simple genérica
   */
  async vibrate(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.vibrate();
    } catch (e) {
      console.warn('[HAPTICS-PLUGIN] Error al vibrar:', e);
    }
  }
}
