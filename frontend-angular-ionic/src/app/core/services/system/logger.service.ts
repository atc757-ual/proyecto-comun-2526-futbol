import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isProd = environment.production;

  log(message: string, data?: unknown): void {
    if (!this.isProd) {
      console.log(`[LOG] ${message}`, ...(data !== undefined ? [data] : []));
    }
  }

  warn(message: string, data?: unknown): void {
    if (!this.isProd) {
      console.warn(`[WARN] ${message}`, ...(data !== undefined ? [data] : []));
    }
  }

  // Los errores siempre se muestran, incluso en producción
  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, ...(error !== undefined ? [error] : []));
  }
}
