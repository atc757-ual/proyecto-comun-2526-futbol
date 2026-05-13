import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class LocationPlugin {
  
  /**
   * Obtiene la ubicación actual del dispositivo
   */
  async getCurrentPosition(): Promise<Position | null> {
    try {
      const hasPermission = await this.requestGeolocationPermission();
      if (!hasPermission) return null;

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      return position;
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      return null;
    }
  }

  /**
   * Consulta si el permiso de geolocalización está concedido
   */
  async isGeolocationPermissionGranted(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state === 'granted';
      } catch (e) {
        return false;
      }
    }
    const geoPerm = await Geolocation.checkPermissions();
    return geoPerm.location === 'granted';
  }

  /**
   * Solicita permiso de geolocalización al usuario
   */
  async requestGeolocationPermission(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      // 1. Primero chequeamos el estado actual usando el API de Permisos
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        if (permissionStatus.state === 'denied') {
          console.error('[GPS Web] Permiso bloqueado permanentemente en el navegador.');
          return false; // No podemos levantar el prompt si está bloqueado
        }
      } catch (e) {
        console.warn('[GPS Web] El navegador no soporta query de permisos, procediendo con solicitud normal.');
      }

      // 2. Intentamos obtener la posición para que el navegador lance el prompt
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (err) => {
            // Log detallado para saber por qué falla sin preguntar
            console.error('[GPS Web] Error específico de Geolocation:', {
              code: err.code,
              message: err.message,
              PERMISSION_DENIED: err.PERMISSION_DENIED,
              POSITION_UNAVAILABLE: err.POSITION_UNAVAILABLE,
              TIMEOUT: err.TIMEOUT
            });
            resolve(false);
          },
          { 
            enableHighAccuracy: false, // Cambiamos a false para el chequeo inicial (es más rápido)
            timeout: 30000,           // Subimos a 30 segundos
            maximumAge: 0 
          }
        );
      });
    }

    try {
      // En nativo, Capacitor tiene un método específico
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted';
    } catch (e) {
      console.error('[GPS Native] Error solicitando permisos:', e);
      return false;
    }
  }
}
