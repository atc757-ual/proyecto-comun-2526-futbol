import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { IAIService, AIAnalysisResponse } from './ai.service.interface';

/**
 * Implementación del orquestador de IA para el Backend en Node.js
 */
@Injectable({
  providedIn: 'root'
})
export class NodeAIService implements IAIService {
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
