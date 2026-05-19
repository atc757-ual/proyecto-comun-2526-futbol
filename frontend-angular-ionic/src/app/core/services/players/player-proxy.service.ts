import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPlayerService } from './player.service.interface';
import { NodePlayerService } from './node-player.service';
import { JavaPlayerService } from './java-player.service';
import { PlatformService } from '../system/platform.service';
import { Player } from '../../models/player.model';

@Injectable({ providedIn: 'root' })
export class PlayerProxyService implements IPlayerService {
  private nodeService = inject(NodePlayerService);
  private javaService = inject(JavaPlayerService);
  private platformService = inject(PlatformService);

  private get activeService(): IPlayerService {
    return this.platformService.getUseJavaBackend() ? this.javaService : this.nodeService;
  }

  getPlayers(filters?: any): Observable<Player[]> {
    return this.activeService.getPlayers(filters);
  }

  getAllPlayers(): Observable<Player[]> {
    return this.activeService.getAllPlayers();
  }

  getPublicPlayers(filters?: any): Observable<Player[]> {
    return this.activeService.getPublicPlayers(filters);
  }

  getPlayer(id: string | number): Observable<Player> {
    return this.activeService.getPlayer(id);
  }

  getPublicPlayer(id: string | number): Observable<Player> {
    return this.activeService.getPublicPlayer(id);
  }

  savePlayer(id: string | number | null, player: Player, file: File | null, oldImageUrl: string | null): Observable<Player> {
    return this.activeService.savePlayer(id, player, file, oldImageUrl);
  }

  addPlayer(player: Player): Observable<Player> {
    return this.activeService.addPlayer(player);
  }

  updatePlayer(id: string | number, player: Player): Observable<Player> {
    return this.activeService.updatePlayer(id, player);
  }

  deletePlayer(id: string | number): Observable<void> {
    return this.activeService.deletePlayer(id);
  }

  toggleFavorite(id: string | number, isFavorite: boolean): Observable<Player> {
    return this.activeService.toggleFavorite(id, isFavorite);
  }

  searchTSDBPlayers(name: string): Observable<any[]> {
    return this.activeService.searchTSDBPlayers(name);
  }

  searchTSDBLeagues(query: string): Observable<any[]> {
    return this.activeService.searchTSDBLeagues(query);
  }

  searchTSDBTeams(query: string): Observable<any[]> {
    return this.activeService.searchTSDBTeams(query);
  }

  getTeamsByLeague(leagueId: string): Observable<any[]> {
    return this.activeService.getTeamsByLeague(leagueId);
  }

  getTSDBPlayersByTeam(teamId: string): Observable<any[]> {
    return this.activeService.getTSDBPlayersByTeam(teamId);
  }

  searchTSDBPlayersByTeam(teamName: string): Observable<any[]> {
    return this.activeService.searchTSDBPlayersByTeam(teamName);
  }

  lookupTSDBPlayer(id: string): Observable<any> {
    return this.activeService.lookupTSDBPlayer(id);
  }

  lookupTSDBTeam(id: string): Observable<any> {
    return this.activeService.lookupTSDBTeam(id);
  }

  lookupTSDBLeague(id: string): Observable<any> {
    return this.activeService.lookupTSDBLeague(id);
  }

  getTVByCountry(country: string): Observable<any[]> {
    return this.activeService.getTVByCountry(country);
  }

  getTSDBLiveScores(): Observable<any[]> {
    return this.activeService.getTSDBLiveScores();
  }

  reverseGeocode(lat: number, lng: number): Observable<string> {
    return this.activeService.reverseGeocode(lat, lng);
  }

  getPlayerTeamsHistory(tsdbId: string): Observable<any[]> {
    return this.activeService.getPlayerTeamsHistory(tsdbId);
  }

  getPlayerHonours(tsdbId: string): Observable<any[]> {
    return this.activeService.getPlayerHonours(tsdbId);
  }

  getPlayerMilestones(tsdbId: string): Observable<any[]> {
    return this.activeService.getPlayerMilestones(tsdbId);
  }

  addComment(playerId: string, comment: any): Observable<any> {
    return this.activeService.addComment(playerId, comment);
  }

  deleteComment(playerId: string, commentId: string): Observable<any> {
    return this.activeService.deleteComment(playerId, commentId);
  }

  updateComment(playerId: string, commentId: string, comment: any): Observable<any> {
    return this.activeService.updateComment(playerId, commentId, comment);
  }

  addPublicComment(playerId: string, comment: any): Observable<any> {
    return this.activeService.addPublicComment(playerId, comment);
  }

  searchPlayers(filters: any): Observable<Player[]> {
    return this.activeService.searchPlayers(filters);
  }

  mapTSDBToPlayer(details: any, apiPlayer?: any): any {
    return this.activeService.mapTSDBToPlayer(details, apiPlayer);
  }

  bulkImportPlayers(apiPlayers: any[]): Observable<any> {
    return this.activeService.bulkImportPlayers(apiPlayers);
  }
}
