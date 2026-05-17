import { Injectable, NgZone, inject } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class LocationPlugin {
  
  private ngZone = inject(NgZone);

  /**
   * Obtiene la ubicación actual del dispositivo
   */
  async getCurrentPosition(): Promise<Position | null> {
    try {
      const hasPermission = await this.requestGeolocationPermission();
      
      if (Capacitor.getPlatform() === 'web') {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => this.ngZone.run(() => resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitudeAccuracy: pos.coords.altitudeAccuracy,
                altitude: pos.coords.altitude,
                speed: pos.coords.speed,
                heading: pos.coords.heading,
              },
              timestamp: pos.timestamp
            } as any)),
            (err) => this.ngZone.run(() => {
              if (err.code !== 1) {
                console.warn('[GPS Web] Error obteniendo coordenada real. Usando fallback:', err.message);
              }
              // Fallback para pintar el mapa aunque el OS bloquee: Centro de España/Madrid por defecto
              resolve({
                coords: { latitude: 40.4168, longitude: -3.7038, accuracy: 100 } as any,
                timestamp: Date.now()
              } as Position);
            }),
            { enableHighAccuracy: false, timeout: 5000 }
          );
        });
      }

      if (!hasPermission) return null;

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      return position;
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      // Fallback nativo
      return {
        coords: { latitude: 40.4168, longitude: -3.7038, accuracy: 100 } as any,
        timestamp: Date.now()
      } as Position;
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
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          return true;
        }
        
        if (permissionStatus.state === 'denied') {
          return false;
        }

        return new Promise((resolve) => {
          // Listener para responder instantáneamente en cuanto el usuario hace clic en "Permitir"
          permissionStatus.onchange = () => {
            this.ngZone.run(() => {
              if (permissionStatus.state === 'granted') resolve(true);
              if (permissionStatus.state === 'denied') resolve(false);
            });
          };

          // Forzamos el prompt — el callback corre dentro de NgZone
          navigator.geolocation.getCurrentPosition(
            () => this.ngZone.run(() => resolve(true)),
            (err) => this.ngZone.run(() => {
              if (err.code === 1) {
                resolve(false);
              } else {
                resolve(true);
              }
            }),
            { 
              enableHighAccuracy: false, 
              timeout: 10000,           
              maximumAge: 0 
            }
          );
        });
      } catch (e) {
        // Fallback si la API permissions no está soportada
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => this.ngZone.run(() => resolve(true)),
            (err) => this.ngZone.run(() => resolve(err.code !== 1)),
            { enableHighAccuracy: false, timeout: 10000 }
          );
        });
      }
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
