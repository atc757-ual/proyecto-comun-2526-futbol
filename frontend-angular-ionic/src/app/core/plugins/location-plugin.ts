import { Injectable, NgZone, inject } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class LocationPlugin {
  private readonly ngZone = inject(NgZone);

  // Sistema de Caché de Ubicación
  private lastPosition: Position | null = null;
  private lastPositionTs: number = 0;

  /**
   * Valida si la coordenada GPS recibida es finita y real (no nula o ficticia)
   */
  private isPositionValid(pos: Position | null): boolean {
    if (!pos) return false;
    const c: any = pos.coords;
    if (!c) return false;
    const lat = Number(c.latitude);
    const lng = Number(c.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0 && typeof c.accuracy === 'undefined');
  }

  /**
   * Limpia la posición cacheada manualmente
   */
  clearCachedPosition() {
    this.lastPosition = null;
    this.lastPositionTs = 0;
  }

  /**
   * Obtiene la ubicación actual del dispositivo
   */
  async getCurrentPosition(options?: {
    useCache?: boolean;
    maxAgeMs?: number;
    enableHighAccuracy?: boolean;
    timeout?: number;
  }): Promise<Position | null> {
    const useCache = options?.useCache ?? false; // Deshabilitado por defecto
    const maxAgeMs = options?.maxAgeMs ?? 10000; // 10 segundos por defecto

    // Si hay una posición válida en caché y no ha expirado, la retornamos de inmediato
    if (useCache && this.lastPosition && (Date.now() - this.lastPositionTs) <= maxAgeMs && this.isPositionValid(this.lastPosition)) {
      // Evitar retornar si coincide con Madrid fallback
      const lat = this.lastPosition.coords.latitude;
      const lng = this.lastPosition.coords.longitude;
      const isMadridFallback = Math.abs(lat - 40.4168) < 0.0001 && Math.abs(lng - (-3.7038)) < 0.0001;
      if (!isMadridFallback) {
        console.log('[GPS-PLUGIN] Retornando ubicación desde caché.');
        return this.lastPosition;
      }
    }

    try {
      const geoOptions: any = {
        enableHighAccuracy: options?.enableHighAccuracy ?? false,
        timeout: options?.timeout ?? 10000
      };

      // Usar Capacitor Geolocation unificado directamente, que funciona de forma estable en todas las plataformas
      const position = await Geolocation.getCurrentPosition(geoOptions);
      const isMadridFallback = Math.abs(position.coords.latitude - 40.4168) < 0.0001 && Math.abs(position.coords.longitude - (-3.7038)) < 0.0001;
      
      if (this.isPositionValid(position) && !isMadridFallback) {
        this.lastPosition = position;
        this.lastPositionTs = Date.now();
      }
      return position;
    } catch (error) {
      console.warn('[GPS] Error obteniendo ubicación real:', error);
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
        // 'granted' = permiso permanente
        // 'prompt' con posición en caché = "Solo esta vez" concedido previamente
        if (result.state === 'granted') return true;
        if (result.state === 'prompt' && this.lastPosition && this.isPositionValid(this.lastPosition)) return true;
        return false;
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
          // Intentar obtener la posición de fondo para precargar la caché
          try {
            const pos = await new Promise<any>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
            if (this.isPositionValid(pos)) {
              this.lastPosition = pos;
              this.lastPositionTs = Date.now();
            }
          } catch (e) { }
          return true;
        }

        if (permissionStatus.state === 'denied') {
          return false;
        }

        return new Promise((resolve) => {
          permissionStatus.onchange = () => {
            this.ngZone.run(() => {
              if (permissionStatus.state === 'granted') resolve(true);
              if (permissionStatus.state === 'denied') resolve(false);
            });
          };

          navigator.geolocation.getCurrentPosition(
            (pos) => this.ngZone.run(() => {
              const position = pos as any;
              if (this.isPositionValid(position)) {
                this.lastPosition = position;
                this.lastPositionTs = Date.now();
              }
              resolve(true);
            }),
            (err) => this.ngZone.run(() => {
              resolve(err.code !== 1);
            }),
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });
      } catch (e) {
        // Fallback si navigator.permissions no es soportado
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => this.ngZone.run(() => {
              const position = pos as any;
              if (this.isPositionValid(position)) {
                this.lastPosition = position;
                this.lastPositionTs = Date.now();
              }
              resolve(true);
            }),
            (err) => this.ngZone.run(() => resolve(err.code !== 1)),
            { enableHighAccuracy: false, timeout: 10000 }
          );
        });
      }
    }

    try {
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted';
    } catch (e) {
      console.error('[GPS Native] Error solicitando permisos:', e);
      return false;
    }
  }
}
