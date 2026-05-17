import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, firstValueFrom, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';

import { Player } from '../models/player.model';
import { IPlayerService } from './player.service.interface';
export { Player };

/**
 * Implementación del servicio de jugadores para el Backend en Node.js (Express/MongoDB)
 */
@Injectable({
  providedIn: 'root'
})
export class NodePlayerService implements IPlayerService {
  private storageService = inject(StorageService);
  private authService = inject(AuthService);

  private http = inject(HttpClient);
  private apiUrl = `${environment.nodeApiUrl}/players`;
  private cache: { [key: string]: { data: any, timestamp: number } } = {};

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

  // Alias para no romper otras partes si las hay
  searchPlayers(filters: any = {}): Observable<Player[]> {
    return this.getPlayers();
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

  /**
   * ORQUESTADOR CENTRAL: Guarda o actualiza un jugador manejando imágenes y auditoría
   */
  savePlayer(id: string | null, player: Player, file: File | null, oldImageUrl: string | null): Observable<Player> {
    const isEdit = !!id;
    const currentUser = this.authService.currentUser();
    const adminEmail = currentUser?.email || 'admin';

    return new Observable<Player>(observer => {
      (async () => {
        try {
          let imageUrl = player.image_url;

          // 1. Gestionar Imagen
          if (file) {
            console.log('[PlayerService] Subiendo nueva imagen a Storage...');
            imageUrl = await this.storageService.uploadImage(file, 'players');

            if (isEdit && oldImageUrl && oldImageUrl.includes('firebasestorage') && oldImageUrl !== imageUrl) {
              await this.storageService.deleteImageByUrl(oldImageUrl, 'players');
            }
          }

          // 2. Preparar Datos Finales y Auditoría
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

          // 3. Persistir en BD
          const request$ = isEdit ? this.updatePlayer(id, finalPlayer) : this.addPlayer(finalPlayer);

          request$.subscribe({
            next: (res) => {
              observer.next(res);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });

        } catch (error) {
          observer.error(error);
        }
      })();
    });
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


  // --- THE SPORTS DB API (A TRAVÉS DEL BACKEND) ---
  searchTSDBPlayers(name: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/search`, {
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

  getPlayerCareer(id: string): Observable<any[]> {
    return this.http.get<any>(`${environment.nodeApiUrl}/external/tsdb/career/${id}`).pipe(
      map(res => res.data || [])
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
    console.log(`[PLAYER-SERVICE] Consultando geocoding para: ${lat}, ${lng}`);

    return this.http.get<any>(url, {
      params: { lat, lng }
    }).pipe(
      map(res => {
        console.log('[PLAYER-SERVICE] Respuesta recibida:', res);
        return res.data?.displayAddress || 'Ubicación desconocida';
      }),
      catchError((err: any) => {
        console.error('[PLAYER-SERVICE] Error en petición de geocoding:', err);
        return throwError(() => err);
      })
    );
  }

  // --- MAPPER CENTRALIZADO ---
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
      location: apiPlayer?.location,
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
            console.error('[PlayerService] Error importando crack:', apiPlayer.name, err);
          }
        }
        observer.next({ success: true, count: successCount });
        observer.complete();
      })();
    });
  }
}
