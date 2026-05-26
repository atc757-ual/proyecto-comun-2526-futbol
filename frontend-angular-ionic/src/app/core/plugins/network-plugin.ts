import { Injectable, NgZone, inject } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';

@Injectable({
  providedIn: 'root',
})
export class NetworkPlugin {
  private readonly ngZone = inject(NgZone);

  /**
   * Obtiene el estado actual de la conexión
   */
  async getStatus(): Promise<ConnectionStatus> {
    try {
      return await Network.getStatus();
    } catch (e) {
      console.warn('[NETWORK-PLUGIN] Falló al obtener estado nativo, asumiendo conectado.');
      return { connected: true, connectionType: 'wifi' };
    }
  }

  /**
   * Se suscribe a los cambios de conexión y ejecuta el callback dentro de la zona de Angular
   */
  onStatusChange(callback: (status: ConnectionStatus) => void) {
    Network.addListener('networkStatusChange', (status) => {
      this.ngZone.run(() => {
        callback(status);
      });
    });
  }
}
