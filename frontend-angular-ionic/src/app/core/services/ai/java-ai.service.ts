import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { IAIService, AIAnalysisResponse } from './ai.service.interface';

/**
 * Implementación del orquestador de IA para el Backend en Java
 * Se comunica con Gemini a través de LangChain4j en el microservicio external-client.
 */
@Injectable({
  providedIn: 'root'
})
export class JavaAIService implements IAIService {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.javaApiUrl}/ai`;

  /**
   * Solicita a la IA un análisis del equipo usando el backend de Java
   */
  analyzeMyTeam(): Observable<AIAnalysisResponse> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.apiUrl}/analyze`, {}, { headers }).pipe(
      map(res => res.data)
    );
  }
}
