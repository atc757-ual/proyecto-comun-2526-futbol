import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { LoggerService } from '../system/logger.service';

import { Player } from '../../models/player.model';
import { IPlayerService } from './player.service.interface';
export { Player };

/**
 * Implementación del servicio de jugadores para el Backend en Node.js (Express/MongoDB)
 */
@Injectable({
  providedIn: 'root'
})
export class NodePlayerService implements IPlayerService {
  private readonly storageService = inject(StorageService);
  private authService   = inject(AuthService);
  private http          = inject(HttpClient);
  private logger        = inject(LoggerService);

  private apiUrl = `${environment.nodeApiUrl}/players`;
  private cache: { [key: string]: { data: any, timestamp: number } } = {};

  // --- 1. CONSULTAS Y APIS PÚBLICAS / GENERALES ---

  getPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(this.apiUrl, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  getAllPlayers(): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(`${this.apiUrl}/all`).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  getPublicPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(`${this.apiUrl}/public`, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  getPlayer(id: string): Observable<Player> {
    return this.http.get<{ data: Player }>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  getPublicPlayer(id: string): Observable<Player> {
    return this.http.get<{ data: Player }>(`${this.apiUrl}/public/${id}`).pipe(
      map(res => res.data)
    );
  }

  searchTSDBPlayers(name: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/search-players`, {
      params: { name }
    }).pipe(
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

  searchTSDBLeagues(name: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/search-leagues`, { params: { name } }).pipe(
      map(res => res.data || [])
    );
  }

  getTVByCountry(country: string): Observable<any[]> {
    const cacheKey = `tv_country_${country}`;
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < 1000 * 60 * 60 * 3) {
      return of(this.cache[cacheKey].data);
    }
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/tv-country/${country}`).pipe(
      map(res => {
        const data = res.data || [];
        this.cache[cacheKey] = { data, timestamp: Date.now() };
        return data;
      })
    );
  }

  getTSDBLiveScores(): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/live`).pipe(
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

  getPlayerMilestones(idPlayer: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/player-milestones/${idPlayer}`).pipe(
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

  searchTSDBPlayersByTeam(teamName: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/search-players-team`, {
      params: { team: teamName }
    }).pipe(
      map(res => res.data || [])
    );
  }

  reverseGeocode(lat: number, lng: number): Observable<string> {
    const url = `${environment.nodeApiUrl}/geo`;
    this.logger.log(`[PlayerService] Consultando geocoding para: ${lat}, ${lng}`);

    return this.http.get<{ data: { displayAddress?: string } }>(url, {
      params: { lat, lng }
    }).pipe(
      map(res => res.data?.displayAddress || 'Ubicación desconocida'),
      catchError((err: unknown) => {
        this.logger.error('[PlayerService] Error en petición de geocoding', err);
        return throwError(() => err);
      })
    );
  }

  // --- 2. OPERACIONES PRIVADAS (ESCRITURA Y MUTACIONES) ---

  /**
   * ORQUESTADOR CENTRAL: Guarda o actualiza un jugador manejando imágenes y auditoría
   */
  savePlayer(id: string | null, player: Player, file: File | null, oldImageUrl: string | null): Observable<Player> {
    const isEdit = !!id;
    return from(this.preparePlayer(player, file, oldImageUrl, isEdit)).pipe(
      switchMap(finalPlayer => isEdit ? this.updatePlayer(id!, finalPlayer) : this.addPlayer(finalPlayer))
    );
  }

  private async preparePlayer(
    player: Player,
    file: File | null,
    oldImageUrl: string | null,
    isEdit: boolean
  ): Promise<Player> {
    const currentUser = this.authService.currentUser();
    const adminEmail  = currentUser?.email || 'admin';
    let imageUrl      = player.image_url;

    if (file) {
      this.logger.log('[PlayerService] Subiendo nueva imagen a Storage...');
      imageUrl = await this.storageService.uploadImage(file, 'players');

      if (isEdit && oldImageUrl?.includes('firebasestorage') && oldImageUrl !== imageUrl) {
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
      finalPlayer.user_id    = currentUser?.uid || 'unknown';
    }

    return finalPlayer;
  }

  addPlayer(player: Player): Observable<Player> {
    const isManual = player.is_manual !== undefined ? player.is_manual : false;
    return this.http.post<{ data: Player }>(this.apiUrl, { ...player, is_manual: isManual }).pipe(
      map(res => res.data)
    );
  }

  updatePlayer(id: string, player: Player): Observable<Player> {
    const isManual = player.is_manual !== undefined ? player.is_manual : false;
    return this.http.put<{ data: Player }>(`${this.apiUrl}/${id}`, { ...player, is_manual: isManual }).pipe(
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

  addComment(playerId: string, comment: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${playerId}/comments`, comment).pipe(
      map(res => res.data)
    );
  }

  addPublicComment(playerId: string, comment: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/public/${playerId}/comments`, comment).pipe(
      map(res => res.data)
    );
  }

  updateComment(playerId: string, commentId: string, comment: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${playerId}/comments/${commentId}`, comment).pipe(
      map(res => res.data)
    );
  }

  deleteComment(playerId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${playerId}/comments/${commentId}`);
  }

  /**
   * Realiza la búsqueda de jugadores aplicando filtros avanzados (Requerido por IPlayerService)
   */
  searchPlayers(filters: any = {}): Observable<Player[]> {
    return this.getPlayers(filters);
  }

  /**
   * Importa múltiples jugadores de forma masiva
   */
  bulkImportPlayers(apiPlayers: any[]): Observable<any> {
    if (!apiPlayers || apiPlayers.length === 0) return of({ success: true, count: 0 });

    return new Observable(observer => {
      (async () => {
        let successCount = 0;
        for (const apiPlayer of apiPlayers) {
          try {
            // 1. Obtener detalles completos si no existen
            const details = apiPlayer.details || await firstValueFrom(this.lookupTSDBPlayer(apiPlayer.externalId)) as any;

            // 2. Mapear a modelo interno
            const mappedPlayer = this.mapTSDBToPlayer(details, apiPlayer);

            // 3. Guardar en BD (savePlayer ya maneja auditoría y user_id)
            await firstValueFrom(this.savePlayer(null, mappedPlayer, null, null));

            successCount++;
          } catch (err) {
            this.logger.error(`[PlayerService] Error importando crack: ${apiPlayer.name}`, err);
          }
        }
        observer.next({ success: true, count: successCount });
        observer.complete();
      })();
    });
  }

  // --- 3. FUNCIONES INTERNAS Y AUXILIARES ---

  private sortPlayers(players: Player[]): Player[] {
    return players.sort((a, b) => {
      // 1. Destacados primero
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // 2. Recientes después
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  mapTSDBToPlayer(details: any, apiPlayer?: any): any {
    if (!details) return null;

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
      ...(apiPlayer?.location ? { location: apiPlayer.location } : {}),
      secondary_team: details.strTeam2,
      summary: details.strDescriptionES || details.strDescriptionEN || '',
      birth_date: details.dateBorn,
      birth_place: details.strBirthLocation,
      birth_country: details.strNationality,
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

    // Calcular edad si hay fecha de nacimiento
    if (details.dateBorn) {
      const born = new Date(details.dateBorn);
      const ageDifMs = Date.now() - born.getTime();
      const ageDate = new Date(ageDifMs);
      player.age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    return player;
  }
}
