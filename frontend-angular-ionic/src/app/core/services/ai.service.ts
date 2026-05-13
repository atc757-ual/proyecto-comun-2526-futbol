import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AIPlayer {
  name: string;
  position: string;
  role: string;
  image_url?: string; // Campo opcional para el matching
}

export interface AIAnalysisResponse {
  analysis: string;
  formation: string;
  idealEleven: AIPlayer[];
  starPlayer: string;
  starPlayerImage?: string; // Campo opcional para el matching
  justification: string;
  tacticalRecommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.nodeApiUrl}/ai`;

  constructor() { }

  /**
   * Solicita a la IA un análisis del equipo del usuario autenticado
   */
  analyzeMyTeam(): Observable<AIAnalysisResponse> {
    return this.http.post<any>(`${this.apiUrl}/analyze`, {}).pipe(
      map(res => res.data)
    );
  }
}
