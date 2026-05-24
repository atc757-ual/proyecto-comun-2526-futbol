import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, firstValueFrom, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { IPlayerService } from './player.service.interface';
import { Player } from '../../models/player.model';

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

  // --- 1. CONSULTAS Y APIS PÚBLICAS / GENERALES ---

  getPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(this.apiUrl, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
  }

  getAllPlayers(): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(`${this.apiUrl}`).pipe(
      map(res => this.sortPlayers(res.data || [])),
      catchError(err => {
        console.error('[TRAZA-ERROR-FRONTEND] Falló getAllPlayers():', err);
        return throwError(() => err);
      })
    );
  }

  getPublicPlayers(filters: any = {}): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(`${this.apiUrl}/public`, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || [])),
      catchError(err => {
        console.error('[TRAZA-ERROR-FRONTEND] Falló getPublicPlayers():', err);
        return throwError(() => err);
      })
    );
  }

  getPlayer(id: string | number): Observable<Player> {
    return this.http.get<{ data: Player }>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.mapPlayer(res.data)),
      switchMap(player => {
        return this.http.get<{ data: any[] }>(`${environment.javaApiUrl}/comments/player/${id}`).pipe(
          map(commRes => {
            player.comments = commRes.data || [];
            return player;
          }),
          catchError(err => {
            console.warn(`[TRAZA-WARN-FRONTEND] Falló cargar comentarios para jugador ${id}:`, err);
            player.comments = [];
            return of(player);
          })
        );
      }),
      catchError(err => {
        console.error(`[TRAZA-ERROR-FRONTEND] Falló getPlayer(${id}):`, err);
        return throwError(() => err);
      })
    );
  }

  getPublicPlayer(id: string | number): Observable<Player> {
    return this.http.get<{ data: Player }>(`${this.apiUrl}/public/${id}`).pipe(
      map(res => this.mapPlayer(res.data)),
      switchMap(player => {
        return this.http.get<{ data: any[] }>(`${environment.javaApiUrl}/comments/public/player/${id}`).pipe(
          map(commRes => {
            player.comments = commRes.data || [];
            return player;
          }),
          catchError(err => {
            console.warn(`[TRAZA-WARN-FRONTEND] Falló cargar comentarios para jugador público ${id}:`, err);
            player.comments = [];
            return of(player);
          })
        );
      }),
      catchError(err => {
        console.error(`[TRAZA-ERROR-FRONTEND] Falló getPublicPlayer(${id}):`, err);
        return throwError(() => err);
      })
    );
  }

  searchTSDBPlayers(name: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/players`, { params: { name } }).pipe(
      map(res => res.data || [])
    );
  }

  lookupTSDBPlayer(id: string): Observable<any> {
    return this.http.get<any>(`${this.externalUrl}/player/${id}`).pipe(
      map(res => res.data)
    );
  }

  lookupTSDBTeam(id: string): Observable<any> {
    return this.http.get<any>(`${this.externalUrl}/team/${id}`).pipe(
      map(res => res.data)
    );
  }

  getTVByCountry(country: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/tv/${country}`).pipe(
      map(res => res.data || [])
    );
  }

  getTSDBLiveScores(): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/live/soccer`).pipe(
      map(res => {
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.livescore)) return data.livescore;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      })
    );
  }

  lookupTSDBLeague(id: string): Observable<any> {
    return this.http.get<any>(`${this.externalUrl}/league/${id}`).pipe(
      map(res => res.data)
    );
  }

  searchTSDBLeagues(query: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/leagues/search`, { params: { query } }).pipe(
      map(res => res.data || [])
    );
  }

  searchTSDBTeams(query: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/teams/search`, { params: { query } }).pipe(
      map(res => res.data || [])
    );
  }

  getTeamsByLeague(leagueId: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/league/${leagueId}/teams`).pipe(
      map(res => res.data || [])
    );
  }

  getTSDBPlayersByTeam(teamId: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/team/${teamId}/players`).pipe(
      map(res => res.data || [])
    );
  }

  searchTSDBPlayersByTeam(teamName: string): Observable<any[]> {
    return this.http.get<any>(`${this.externalUrl}/players/search-team`, { params: { team: teamName } }).pipe(
      map(res => res.data || [])
    );
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

  reverseGeocode(lat: number, lng: number): Observable<string> {
    return this.http.get<any>(this.geoUrl, { params: { lat, lng } }).pipe(
      map(res => res.data?.displayAddress || 'Ubicación desconocida')
    );
  }

  // --- 2. OPERACIONES PRIVADAS (ESCRITURA Y MUTACIONES) ---

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

           const activeUid = this.authService.getUID();
           const rawUid = activeUid || 'unknown';
           const isNumeric = rawUid && !isNaN(Number(rawUid)) && rawUid !== 'unknown';
           const uid: any = isNumeric ? Number(rawUid) : rawUid;

          // Asegurar compatibilidad de userId tanto para creación como para edición en Java
          finalPlayer.userId = player.userId || player.user_id || uid;

          if (!isEdit) {
            finalPlayer.created_by = adminEmail;
            finalPlayer.created_at = new Date();
            finalPlayer.user_id = uid;
            finalPlayer.userId = uid;
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
    const activeUid = this.authService.getUID();
    const p: any = player;
    const rawUid = activeUid || p.user_id || 'manual';
    const isNumeric = rawUid && !isNaN(Number(rawUid)) && rawUid !== 'manual';
    const uid: any = isNumeric ? Number(rawUid) : rawUid;

    const finalPlayer: any = {
      name: p.name,
      fullname: p.fullname || p.name,
      team: p.team,
      secondary_team: p.secondary_team || null,
      league: p.league || null,
      age: p.age || null,
      birth_date: p.birth_date || null,
      birth_place: p.birth_place || null,
      birth_country: p.birth_country || null,
      nationality: p.nationality || null,
      height: p.height || null,
      weight: p.weight || null,
      number: p.number !== undefined ? p.number : null,
      position: p.position || null,
      side: p.side || null,
      image_url: p.image_url || null,
      user_id: uid,
      userId: uid,
      external_id: p.external_id !== undefined && p.external_id !== null ? p.external_id : null,
      latitude: p.latitude !== undefined && p.latitude !== null ? p.latitude : (p.location?.coordinates?.[1] !== undefined ? p.location.coordinates[1] : null),
      longitude: p.longitude !== undefined && p.longitude !== null ? p.longitude : (p.location?.coordinates?.[0] !== undefined ? p.location.coordinates[0] : null),
      is_manual: p.is_manual !== undefined ? p.is_manual : false,
      is_favorite: p.is_favorite !== undefined ? p.is_favorite : false,
      is_featured: p.is_featured !== undefined ? p.is_featured : false,
      summary: p.summary || null
    };

    if (p.social_media) {
      finalPlayer.social_media = {
        facebook: p.social_media.facebook || null,
        instagram: p.social_media.instagram || null,
        twitter: p.social_media.twitter || null,
        website: p.social_media.website || null
      };
    }

    if (p.tsdb_ids) {
      finalPlayer.tsdb_ids = {
        player_id: p.tsdb_ids.player_id || null,
        team_id: p.tsdb_ids.team_id || null,
        team_id2: p.tsdb_ids.team_id2 || null,
        league_id: p.tsdb_ids.league_id || null,
        transfermarkt_id: p.tsdb_ids.transfermarkt_id || null,
        espn_id: p.tsdb_ids.espn_id || null,
        wikidata_id: p.tsdb_ids.wikidata_id || null
      };
    }

    if (p.images) {
      finalPlayer.images = {
        thumb: p.images.thumb || null,
        cutout: p.images.cutout || null,
        banner: p.images.banner || null
      };
    }

    return this.http.post<{ data: Player }>(this.apiUrl, finalPlayer).pipe(
      map(res => this.mapPlayer(res.data)),
      catchError(err => {
        console.error('[TRAZA-ERROR-FRONTEND] Falló addPlayer():', err);
        return throwError(() => err);
      })
    );
  }

  updatePlayer(id: string | number, player: Player): Observable<Player> {
    const activeUid = this.authService.getUID();
    const p: any = player;
    const rawUid = activeUid || p.user_id || 'manual';
    const isNumeric = rawUid && !isNaN(Number(rawUid)) && rawUid !== 'manual';
    const uid: any = isNumeric ? Number(rawUid) : rawUid;

    const finalPlayer: any = {
      id: id,
      name: p.name,
      fullname: p.fullname || p.name,
      team: p.team,
      secondary_team: p.secondary_team || null,
      league: p.league || null,
      age: p.age || null,
      birth_date: p.birth_date || null,
      birth_place: p.birth_place || null,
      birth_country: p.birth_country || null,
      nationality: p.nationality || null,
      height: p.height || null,
      weight: p.weight || null,
      number: p.number !== undefined ? p.number : null,
      position: p.position || null,
      side: p.side || null,
      image_url: p.image_url || null,
      user_id: uid,
      userId: uid,
      external_id: p.external_id !== undefined && p.external_id !== null ? p.external_id : null,
      latitude: p.latitude !== undefined && p.latitude !== null ? p.latitude : (p.location?.coordinates?.[1] !== undefined ? p.location.coordinates[1] : null),
      longitude: p.longitude !== undefined && p.longitude !== null ? p.longitude : (p.location?.coordinates?.[0] !== undefined ? p.location.coordinates[0] : null),
      is_manual: p.is_manual !== undefined ? p.is_manual : false,
      is_favorite: p.is_favorite !== undefined ? p.is_favorite : false,
      is_featured: p.is_featured !== undefined ? p.is_featured : false,
      summary: p.summary || null
    };

    if (p.social_media) {
      finalPlayer.social_media = {
        facebook: p.social_media.facebook || null,
        instagram: p.social_media.instagram || null,
        twitter: p.social_media.twitter || null,
        website: p.social_media.website || null
      };
    }

    if (p.tsdb_ids) {
      finalPlayer.tsdb_ids = {
        player_id: p.tsdb_ids.player_id || null,
        team_id: p.tsdb_ids.team_id || null,
        team_id2: p.tsdb_ids.team_id2 || null,
        league_id: p.tsdb_ids.league_id || null,
        transfermarkt_id: p.tsdb_ids.transfermarkt_id || null,
        espn_id: p.tsdb_ids.espn_id || null,
        wikidata_id: p.tsdb_ids.wikidata_id || null
      };
    }

    if (p.images) {
      finalPlayer.images = {
        thumb: p.images.thumb || null,
        cutout: p.images.cutout || null,
        banner: p.images.banner || null
      };
    }

    return this.http.put<{ data: Player }>(this.apiUrl, finalPlayer).pipe(
      map(res => this.mapPlayer(res.data)),
      catchError(err => {
        console.error(`[TRAZA-ERROR-FRONTEND] Falló updatePlayer(${id}):`, err);
        return throwError(() => err);
      })
    );
  }

  toggleFavorite(id: string | number, isFavorite: boolean): Observable<Player> {
    return this.http.put<{ data: Player }>(`${this.apiUrl}/${id}/favorite?isFavorite=${isFavorite}`, {}).pipe(
      map(res => this.mapPlayer(res.data))
    );
  }

  deletePlayer(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error(`[TRAZA-ERROR-FRONTEND] Falló deletePlayer(${id}):`, err);
        return throwError(() => err);
      })
    );
  }

  addComment(playerId: string, comment: any): Observable<any> {
    const payload = { ...comment, playerId };
    return this.http.post<any>(`${environment.javaApiUrl}/comments`, payload).pipe(
      map(res => res.data)
    );
  }

  updateComment(playerId: string, commentId: string, comment: any): Observable<any> {
    return this.http.put<any>(`${environment.javaApiUrl}/comments`, { ...comment, id: commentId, playerId }).pipe(
      map(res => res.data)
    );
  }

  deleteComment(playerId: string, commentId: string): Observable<any> {
    return this.http.delete<any>(`${environment.javaApiUrl}/comments/${commentId}`);
  }

  addPublicComment(playerId: string, comment: any): Observable<any> {
    const payload = { ...comment, playerId, isPublic: true };
    return this.http.post<any>(`${environment.javaApiUrl}/comments/public`, payload).pipe(
      map(res => res.data)
    );
  }

  /**
   * Realiza la búsqueda de jugadores aplicando filtros avanzados (Requerido por IPlayerService)
   */
  searchPlayers(filters: any): Observable<Player[]> {
    return this.http.get<{ data: Player[] }>(this.apiUrl, { params: filters }).pipe(
      map(res => this.sortPlayers(res.data || []))
    );
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

  // --- 3. FUNCIONES INTERNAS Y AUXILIARES ---

  private mapPlayer(p: any): Player {
    if (p) {
      if (p.id !== undefined && p.id !== null && !p._id) {
        p._id = String(p.id);
      }
      p.image_url = p.image_url || p.imageUrl;
      p.birth_date = p.birth_date || p.birthDate;
      p.birth_place = p.birth_place || p.birthPlace;
      p.birth_country = p.birth_country || p.birthCountry;
      p.secondary_team = p.secondary_team || p.secondaryTeam;
      p.external_id = p.external_id !== undefined && p.external_id !== null ? p.external_id : p.externalId;
      p.user_id = p.user_id || p.userId;
      p.userId = p.userId || p.user_id;
      p.is_manual = p.is_manual !== undefined ? p.is_manual : p.isManual;
      p.is_favorite = p.is_favorite !== undefined ? p.is_favorite : p.isFavorite;
      p.is_featured = p.is_featured !== undefined ? p.is_featured : p.isFeatured;
      p.created_at = p.created_at || p.createdAt;
      p.updated_at = p.updated_at || p.updatedAt;

      if (p.latitude !== undefined && p.latitude !== null && p.longitude !== undefined && p.longitude !== null) {
        p.location = {
          type: 'Point',
          coordinates: [Number(p.longitude), Number(p.latitude)]
        };
      }

      if (p.socialMedia && !p.social_media) {
        p.social_media = p.socialMedia;
      }
      if (p.tsdbIds && !p.tsdb_ids) {
        p.tsdb_ids = {
          player_id: p.tsdbIds.playerId,
          team_id: p.tsdbIds.teamId,
          team_id2: p.tsdbIds.teamId2,
          league_id: p.tsdbIds.leagueId,
          transfermarkt_id: p.tsdbIds.transfermarktId,
          espn_id: p.tsdbIds.espnId,
          wikidata_id: p.tsdbIds.wikidataId
        };
      }
    }
    return p;
  }

  private sortPlayers(players: Player[]): Player[] {
    players.forEach(p => this.mapPlayer(p));
    return players.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  private mapTSDBList(data: any[]): any[] {
    return data.map(item => ({
      strTeam: item.strFormerTeam || item.strHonour || item.strMilestone,
      strTeamBadge: item.strBadge || item.strHonourTrophy || item.strMilestoneLogo,
      strSeason: item.strSeason || item.dateMilestone || (item.strJoined ? `${item.strJoined}${item.strDeparted ? ' - ' + item.strDeparted : ' - Presente'}` : '')
    }));
  }

  mapTSDBToPlayer(details: any, apiPlayer?: any): any {
    if (details && details.players && Array.isArray(details.players) && details.players.length > 0) {
      details = details.players[0];
    } else if (details && details.data && details.data.players && Array.isArray(details.data.players) && details.data.players.length > 0) {
      details = details.data.players[0];
    }

    const player: any = {
      name: details?.strPlayer || apiPlayer?.name,
      fullname: details?.strPlayerAlternate || details?.strPlayer || apiPlayer?.name,
      team: details?.strTeam || apiPlayer?.team,
      nationality: details?.strNationality || apiPlayer?.nationality,
      position: details?.strPosition || apiPlayer?.position,
      side: details?.strSide || apiPlayer?.strSide,
      image_url: details?.strThumb || apiPlayer?.image_url,
      external_id: details?.idPlayer || apiPlayer?.externalId,
      is_manual: false,
      ...(apiPlayer?.location ? { location: apiPlayer.location } : {}),
      summary: details?.strDescriptionES || details?.strDescriptionEN || '',
      birth_date: details?.dateBorn,
      birth_place: details?.strBirthLocation,
      height: details?.strHeight,
      weight: details?.strWeight,
      number: details?.strNumber ? parseInt(details?.strNumber) : undefined,
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
}
