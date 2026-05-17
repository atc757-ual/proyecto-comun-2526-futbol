import { InjectionToken } from '@angular/core';
import { IPlayerService } from './player.service.interface';

/**
 * Token de inyección para el servicio de jugadores.
 * Esto permite usar el patrón Strategy para alternar entre Node y Java.
 */
export const PLAYER_SERVICE_TOKEN = new InjectionToken<IPlayerService>('PlayerServiceToken');
