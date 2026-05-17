import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, firstValueFrom, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { IPlayerService } from './player.service.interface';
import { Player } from '../models/player.model';

/**
 * Implementación del servicio de jugadores para el Backend en Java (Spring Boot)
 * Utiliza el Gateway de Java para todas las operaciones.
 */
@Injectable({
  providedIn: 'root'
})
export class JavaPlayerService implements IPlayerService {
  private storageService = inject(StorageService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.javaApiUrl}/players`;
  private externalUrl = `${environment.javaApiUrl}/external`;
  private geoUrl = `${environment.javaApiUrl}/geo`;
  
  private cache: { [key: string]: { data: any, timestamp: number } } = {};

  /**
   * Obtiene la lista de jugadores filtrada
   */
  getPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(this.apiUrl, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  /**
   * Obtiene todos los jugadores (Vista Admin)
   */
  getAllPlayers(): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(`${this.apiUrl}`).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  /**
   * Obtiene jugadores para la vista pública (sin login)
   */
  getPublicPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(`${this.apiUrl}/public`, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  private sortPlayers(players: Player[]): Player[] {
    return players.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * Obtiene un jugador por ID
   */
  getPlayer(id: string | number): Observable<Player> {
    return this.http.get<{ data: Player }>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Obtiene un jugador público por ID
   */
  getPublicPlayer(id: string | number): Observable<Player> {
    return this.http.get<{ data: Player }>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Guarda o actualiza un jugador
   */
  savePlayer(id: string | number | null, player: Player, file: File | null, oldImageUrl: string | null): Observable<Player> {
    const isEdit = !!id;
    const currentUser = this.authService.currentUser();
    const adminEmail = currentUser?.email || 'admin';

    return new Observable<Player>(observer => {
      (async () => {
        try {
          let imageUrl = player.image_url;

          if (file) {
            imageUrl = await this.storageService.uploadImage(file, 'players');
            if (isEdit && oldImageUrl && oldImageUrl.includes('firebasestorage') && oldImageUrl !== imageUrl) {
              await this.storageService.deleteImageByUrl(oldImageUrl, 'players');
            }
          }

          const finalPlayer: Player = {
            ...player,
            image_url: imageUrl,
            updated_by: adminEmail,
            updated_at: new Date()
          };

          if (!isEdit) {
            finalPlayer.created_by = adminEmail;
            finalPlayer.created_at = new Date();
            finalPlayer.user_id = currentUser?.uid || 'unknown';
          }

          const request$ = isEdit ? this.updatePlayer(id, finalPlayer) : this.addPlayer(finalPlayer);
          request$.subscribe({
            next: (res) => { observer.next(res); observer.complete(); },
            error: (err) => observer.error(err)
          });
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  addPlayer(player: Player): Observable<Player> {
    return this.http.post<{ data: Player }>(this.apiUrl, player).pipe(map(res => res.data));
  }

  updatePlayer(id: string | number, player: Player): Observable<Player> {
    return this.http.put<{ data: Player }>(this.apiUrl, player).pipe(map(res => res.data));
  }

  toggleFavorite(id: string | number, isFavorite: boolean): Observable<Player> {
    // En Java, el PUT suele recibir el objeto completo o tenemos un endpoint específico
    // Para simplificar, asumimos que el backend acepta actualizaciones parciales o el objeto
    return this.http.put<{ data: Player }>(this.apiUrl, { id, isFavorite }).pipe(map(res => res.data));
  }

  deletePlayer(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // --- EXTERNAL APIs ---

  searchTSDBPlayers(name: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/players`, { params: { name } }).pipe(map(res => res.data || []));
  }

  lookupTSDBPlayer(id: string): Observable<any> {
    return this.http.get<any>(`${this.externalUrl}/player/${id}`).pipe(map(res => res.data));
  }

  lookupTSDBTeam(id: string): Observable<any> {
    return this.http.get<any>(`${this.externalUrl}/team/${id}`).pipe(map(res => res.data));
  }

  getTVByCountry(country: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/tv/${country}`).pipe(map(res => res.data || []));
  }

  getTSDBLiveScores(): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/live/soccer`).pipe(map(res => res.data || []));
  }

  lookupTSDBLeague(id: string): Observable<any> {
    return this.http.get<any>(`${this.externalUrl}/league/${id}`).pipe(map(res => res.data));
  }

  searchTSDBLeagues(query: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/leagues/search`, { params: { query } }).pipe(map(res => res.data || []));
  }

  searchTSDBTeams(query: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/teams/search`, { params: { query } }).pipe(map(res => res.data || []));
  }

  getTeamsByLeague(leagueId: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/league/${leagueId}/teams`).pipe(map(res => res.data || []));
  }

  getTSDBPlayersByTeam(teamId: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/team/${teamId}/players`).pipe(map(res => res.data || []));
  }

  searchTSDBPlayersByTeam(teamName: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/players/search-team`, { params: { team: teamName } }).pipe(map(res => res.data || []));
  }

  getPlayerTeamsHistory(tsdbId: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/player/${tsdbId}/history`).pipe(
      map(res => this.mapTSDBList(res.data?.lookup || []))
    );
  }

  getPlayerHonours(tsdbId: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/player/${tsdbId}/honours`).pipe(
      map(res => this.mapTSDBList(res.data?.lookup || []))
    );
  }

  getPlayerMilestones(tsdbId: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/player/${tsdbId}/milestones`).pipe(
      map(res => this.mapTSDBList(res.data?.lookup || []))
    );
  }

  private mapTSDBList(data: any[]): any[] {
    // Normalización de campos para el componente UI (Trayectoria, Palmarés, etc.)
    return data.map(item => ({
      strTeam: item.strFormerTeam || item.strHonour || item.strMilestone,
      strTeamBadge: item.strBadge || item.strHonourTrophy || item.strMilestoneLogo,
      strSeason: item.strSeason || item.dateMilestone || (item.strJoined ? `${item.strJoined}${item.strDeparted ? ' - ' + item.strDeparted : ' - Presente'}` : '')
    }));
  }

  reverseGeocode(lat: number, lng: number): Observable<string> {
    return this.http.get<any>(this.geoUrl, { params: { lat, lng } }).pipe(
      map(res => res.data?.displayAddress || 'Ubicación desconocida')
    );
  }

  // --- COMMENTS ---

  addComment(playerId: string, comment: any): Observable<any> {
    const payload = { ...comment, playerId };
    return this.http.post<any>(`${environment.javaApiUrl}/comments`, payload).pipe(
      map(res => res.data)
    );
  }

  updateComment(playerId: string, commentId: string, comment: any): Observable<any> {
    // En Java solemos usar un PUT al endpoint de comentarios con el ID
    return this.http.put<any>(`${environment.javaApiUrl}/comments`, { ...comment, id: commentId, playerId }).pipe(
      map(res => res.data)
    );
  }

  deleteComment(playerId: string, commentId: string): Observable<any> {
    return this.http.delete<any>(`${environment.javaApiUrl}/comments/${commentId}`);
  }

  addPublicComment(playerId: string, comment: any): Observable<any> {
    const payload = { ...comment, playerId, isPublic: true };
    return this.http.post<any>(`${environment.javaApiUrl}/comments`, payload).pipe(
      map(res => res.data)
    );
  }

  // --- SEARCH ---

  searchPlayers(filters: any): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(this.apiUrl, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  // --- MAPPERS ---

  mapTSDBToPlayer(details: any, apiPlayer?: any): any {
    // La lógica de mapeo es idéntica
    const player: any = {
      name: details.strPlayer || apiPlayer?.name,
      fullname: details.strPlayerAlternate || details.strPlayer || apiPlayer?.name,
      team: details.strTeam || apiPlayer?.team,
      nationality: details.strNationality || apiPlayer?.nationality,
      position: details.strPosition || apiPlayer?.position,
      side: details.strSide || apiPlayer?.strSide,
      image_url: details.strThumb || apiPlayer?.image_url,
      external_id: details.idPlayer || apiPlayer?.externalId,
      is_manual: false,
      summary: details.strDescriptionES || details.strDescriptionEN || '',
      birth_date: details.dateBorn,
      birth_place: details.strBirthLocation,
      height: details.strHeight,
      weight: details.strWeight,
      number: details.strNumber ? parseInt(details.strNumber) : undefined,
      tsdb_ids: {
        player_id: details.idPlayer,
        team_id: details.idTeam,
        team_id2: details.idTeam2,
        league_id: details.idLeague,
        transfermarkt_id: details.idTransferMkt,
        espn_id: details.idESPN,
        wikidata_id: details.idWikidata
      },
      social_media: {
        facebook: details.strFacebook,
        instagram: details.strInstagram,
        twitter: details.strTwitter,
        website: details.strWebsite
      },
      images: {
        thumb: details.strThumb,
        cutout: details.strCutout,
        banner: details.strBanner
      }
    };

    if (details.dateBorn) {
      const born = new Date(details.dateBorn);
      const ageDifMs = Date.now() - born.getTime();
      const ageDate = new Date(ageDifMs);
      player.age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    return player;
  }

  bulkImportPlayers(apiPlayers: any[]): Observable<any> {
    if (!apiPlayers || apiPlayers.length === 0) return of({ success: true, count: 0 });

    return new Observable(observer => {
      (async () => {
        let successCount = 0;
        for (const apiPlayer of apiPlayers) {
          try {
            const details = await firstValueFrom(this.lookupTSDBPlayer(apiPlayer.idPlayer || apiPlayer.externalId));
            const mappedPlayer = this.mapTSDBToPlayer(details, apiPlayer);
            await firstValueFrom(this.savePlayer(null, mappedPlayer, null, null));
            successCount++;
          } catch (err) {
            console.error('[JavaPlayerService] Error importando:', apiPlayer.name, err);
          }
        }
        observer.next({ success: true, count: successCount });
        observer.complete();
      })();
    });
  }
}
