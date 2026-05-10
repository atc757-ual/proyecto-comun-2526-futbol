import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Player {
  id?: string;
  name: string;
  team: string;
  league: string;
  position: string;
  imageUrl: string;
  birthDate: string;
  registrationDate: string;
  stats: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.nodeApiUrl}/players`;

  constructor() {}

  /**
   * Obtiene todos los jugadores registrados en el sistema
   */
  getPlayers(): Observable<Player[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.data || [])
    );
  }

  /**
   * Obtiene un jugador por su ID único
   */
  getPlayerById(id: string): Observable<Player> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Búsqueda avanzada de jugadores con filtros
   */
  searchPlayers(filters: { name?: string; teamLeague?: string; dateFrom?: string }): Observable<Player[]> {
    let params: any = {};
    if (filters.name) params.name = filters.name;
    if (filters.teamLeague) params.teamLeague = filters.teamLeague;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;

    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  /**
   * Registra un nuevo jugador (Requiere Auth)
   */
  addPlayer(player: Player): Observable<Player> {
    return this.http.post<any>(this.apiUrl, player).pipe(
      map(res => res.data)
    );
  }

  /**
   * Actualiza los datos de un jugador existente
   */
  updatePlayer(id: string, player: Partial<Player>): Observable<Player> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, player).pipe(
      map(res => res.data)
    );
  }

  /**
   * Elimina un jugador del sistema
   */
  deletePlayer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
