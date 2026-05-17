import { Observable } from 'rxjs';
import { Player } from '../models/player.model';

export interface IPlayerService {
  getPlayers(filters?: any): Observable<Player[]>;
  getAllPlayers(): Observable<Player[]>;
  getPublicPlayers(filters?: any): Observable<Player[]>;
  getPlayer(id: string | number): Observable<Player>;
  getPublicPlayer(id: string | number): Observable<Player>;
  savePlayer(id: string | number | null, player: Player, file: File | null, oldImageUrl: string | null): Observable<Player>;
  addPlayer(player: Player): Observable<Player>;
  updatePlayer(id: string | number, player: Player): Observable<Player>;
  deletePlayer(id: string | number): Observable<void>;
  toggleFavorite(id: string | number, isFavorite: boolean): Observable<Player>;
  
  // External APIs (TSDB, Geocoding)
  searchTSDBPlayers(name: string): Observable<any[]>;
  searchTSDBLeagues(query: string): Observable<any[]>;
  searchTSDBTeams(query: string): Observable<any[]>;
  getTeamsByLeague(leagueId: string): Observable<any[]>;
  getTSDBPlayersByTeam(teamId: string): Observable<any[]>;
  searchTSDBPlayersByTeam(teamName: string): Observable<any[]>;
  lookupTSDBPlayer(id: string): Observable<any>;
  lookupTSDBTeam(id: string): Observable<any>;
  lookupTSDBLeague(id: string): Observable<any>;
  getTVByCountry(country: string): Observable<any[]>;
  getTSDBLiveScores(): Observable<any[]>;
  reverseGeocode(lat: number, lng: number): Observable<string>;
  
  // Extra Details (Career, Honours, Milestones)
  getPlayerTeamsHistory(tsdbId: string): Observable<any[]>;
  getPlayerHonours(tsdbId: string): Observable<any[]>;
  getPlayerMilestones(tsdbId: string): Observable<any[]>;

  // Comments
  addComment(playerId: string, comment: any): Observable<any>;
  deleteComment(playerId: string, commentId: string): Observable<any>;
  updateComment(playerId: string, commentId: string, comment: any): Observable<any>;
  addPublicComment(playerId: string, comment: any): Observable<any>;

  // Search
  searchPlayers(filters: any): Observable<Player[]>;
  
  // Mappers and Bulk
  mapTSDBToPlayer(details: any, apiPlayer?: any): any;
  bulkImportPlayers(apiPlayers: any[]): Observable<any>;
}
