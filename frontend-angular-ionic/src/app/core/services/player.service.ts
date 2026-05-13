import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Player {
  _id?: string;
  name: string;
  age?: number;
  birth_date?: string;
  birth_place?: string;
  birth_country?: string;
  nationality?: string;
  height?: string;
  weight?: string;
  number?: number;
  position: string;
  image_url?: string;
  team: string;
  secondary_team?: string;
  league?: string;
  user_id: string; // Obligatorio
  external_id?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
  comments?: any[];
  status?: boolean;
  fullname?: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
  summary?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  images?: {
    thumb?: string;
    poster?: string;
    cutout?: string;
    cartoon?: string;
    banner?: string;
  };
  tsdb_ids?: {
    player_id?: string;
    team_id?: string;
    team_id2?: string;
    league_id?: string;
  };
  is_manual?: boolean;
  isFavorite?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.nodeApiUrl}/players`;

  constructor() { }

  getPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(this.apiUrl, { params: filters }).pipe(
      map(res => res.data)
    );
  }

  getPublicPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(`${this.apiUrl}/public`, { params: filters }).pipe(
      map(res => res.data)
    );
  }

  // Alias para no romper otras partes si las hay
  searchPlayers(filters: any = {}): Observable<Player[]> {
    return this.getPlayers(filters);
  }

  getPlayer(id: string): Observable<Player> {
    return this.http.get<{ data: Player }>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  addPlayer(player: Player): Observable<Player> {
    return this.http.post<{ data: Player }>(this.apiUrl, { ...player, is_manual: false }).pipe(
      map(res => res.data)
    );
  }

  updatePlayer(id: string, player: Player): Observable<Player> {
    return this.http.put<{ data: Player }>(`${this.apiUrl}/${id}`, { ...player, is_manual: false }).pipe(
      map(res => res.data)
    );
  }

  toggleFavorite(id: string, isFavorite: boolean): Observable<Player> {
    return this.http.put<{ data: Player }>(`${this.apiUrl}/${id}`, { isFavorite, is_manual: false }).pipe(
      map(res => res.data)
    );
  }

  deletePlayer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPlayerSquad(externalId: number): Observable<any> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/player-squad/${externalId}`).pipe(
      map(res => res.data)
    );
  }

  getLatestPlayerStats(externalId: number): Observable<any> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/player-stats-latest/${externalId}`).pipe(
      map(res => res.data)
    );
  }

  addComment(playerId: string, comment: any): Observable<any> {
    return this.http.post<any>(`${environment.nodeApiUrl}/players/${playerId}/comments`, comment).pipe(
      map(res => res.data)
    );
  }

  updateComment(playerId: string, commentId: string, comment: any): Observable<any> {
    return this.http.put<any>(`${environment.nodeApiUrl}/players/${playerId}/comments/${commentId}`, comment).pipe(
      map(res => res.data)
    );
  }

  deleteComment(playerId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${environment.nodeApiUrl}/players/${playerId}/comments/${commentId}`);
  }


  // --- THE SPORTS DB API (A TRAVÉS DEL BACKEND) ---
  searchTSDBPlayers(name: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/search`, { params: { name } }).pipe(
      map(res => res.data || [])
    );
  }

  lookupTSDBPlayer(id: string): Observable<any> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/player/${id}`).pipe(
      map(res => res.data)
    );
  }

  lookupTSDBTeam(id: string): Observable<any> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/team/${id}`).pipe(
      map(res => res.data)
    );
  }

  lookupTSDBLeague(id: string): Observable<any> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/league/${id}`).pipe(
      map(res => res.data)
    );
  }

  getTSDBLeagues(): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/leagues`).pipe(
      map(res => res.data || [])
    );
  }

  searchTSDBLeagues(name: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/search-leagues`, { params: { name } }).pipe(
      map(res => res.data || [])
    );
  }

  getTSDBTVBySport(sport: string = 'soccer'): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/tv/${sport}`).pipe(
      map(res => res.data || [])
    );
  }

  getTeamsByLeague(idLeague: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/teams-by-league/${idLeague}`).pipe(
      map(res => res.data || [])
    );
  }

  getPlayerTeamsHistory(idPlayer: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/player-teams/${idPlayer}`).pipe(
      map(res => res.data || [])
    );
  }

  getPlayerHonours(idPlayer: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/player-honours/${idPlayer}`).pipe(
      map(res => res.data || [])
    );
  }

  searchTSDBTeams(name: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/search-teams`, { params: { name } }).pipe(
      map(res => res.data || [])
    );
  }

  getTSDBPlayersByTeam(idTeam: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/team-players/${idTeam}`).pipe(
      map(res => res.data || [])
    );
  }
}
