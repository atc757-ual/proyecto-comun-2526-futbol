import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { LoggerService } from '../system/logger.service';
import { firstValueFrom, map, Observable, switchMap, take, catchError, of, throwError } from 'rxjs';
import { INewsService } from './news.service.interface';

import { NewsItem } from '../../models/news.model';
import { normalizeDateToCorba, normalizeNewsForApi, mapDateFromCorba } from './news.utils';
export { NewsItem };

/**
 * Implementación del servicio de noticias para el Backend en Node.js (Express/CORBA Bridge)
 */
@Injectable({ providedIn: 'root' })
export class NodeNewsService implements INewsService {
  private http        = inject(HttpClient);
  private auth        = inject(Auth);
  private readonly authService = inject(AuthService);
  private logger      = inject(LoggerService);
  private apiUrl = environment.nodeApiUrl + '/news';
  private feedUrl = environment.nodeApiUrl + '/news';
  private featuredUrl = environment.nodeApiUrl + '/news/featured';

  private normalizeNewsForApi(news: NewsItem): NewsItem {
    return normalizeNewsForApi(news);
  }

  private getUserRoleHeader(): string {
    const token = localStorage.getItem('jwt_token');
    if (!token) return 'USER';
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = JSON.parse(atob(payloadBase64));
      return (payloadJson.role || 'USER').toUpperCase();
    } catch (e) {
      return 'USER';
    }
  }

  /**
   * Obtiene todas las noticias (Panel Admin)
   */
  getNews(): Observable<NewsItem[]> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });

    return this.http.get<any>(`${this.apiUrl}?all=true`, { headers }).pipe(
      map(response => {
        const processed = (response.data || []).map((n: any) => this.mapToNews(n));
        return processed;
      }),
      catchError((err: unknown) => {
        this.logger.error('[NewsService] Error crítico de conexión', err);
        return throwError(() => new Error('No se pudo conectar con el servidor de noticias'));
      })
    );
  }

  /**
   * Obtiene solo las noticias activas (Público)
   */
  getFeed(): Observable<NewsItem[]> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });
    return this.http.get<any>(this.feedUrl, { headers }).pipe(
      map(response => {
        const processed = (response.data || []).map((n: any) => this.mapToNews(n));
        return processed;
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Obtiene solo las noticias destacadas
   */
  getFeatured(): Observable<NewsItem[]> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });
    return this.http.get<any>(this.featuredUrl, { headers }).pipe(
      map(response => (response.data || []).map((n: any) => this.mapToNews(n)))
    );
  }

  /**
   * MAPPER CENTRALIZADO: Procesa una noticia y normaliza sus campos
   */
  mapToNews(item: any): NewsItem {
    if (!item) return {} as NewsItem;

    // Clonamos para no mutar el original
    const news = { ...item };

    // Normalización de ID (CORBA usa 'id', Mongo usa '_id')
    news.id = item.id || item._id;

    // Normalización de fecha (DD/MM/YYYY -> YYYY-MM-DD para inputs de Angular)
    news.date = mapDateFromCorba(news.date) || news.date;
    news.expiryDate = mapDateFromCorba(news.expiryDate) || news.expiryDate;

    // NORMALIZACIÓN DE ESTADO (Crucial para el diseño)
    // Aceptamos true, 1 (CORBA), o "true" (String)
    news.isActive = (item.isActive === true || item.isActive === 1 || item.isActive === 'true' || item.active === true);

    return news as NewsItem;
  }

  /**
   * Obtiene una noticia por ID
   */
  getNewsById(id: string): Observable<NewsItem | null> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });

    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => this.mapToNews(response.data)),
      catchError((err: unknown) => {
        this.logger.warn(`[NewsService] Error al obtener noticia ${id}`, err);
        return of(null);
      })
    );
  }

  private readonly storageService = inject(StorageService);

  /**
   * ORQUESTADOR CENTRAL: Guarda o actualiza una noticia manejando imágenes y CORBA
   */
  saveNews(news: NewsItem, file: File | null, oldImageUrl: string | null): Observable<any> {
    const isEdit = !!news.id;
    
    // Convertimos la lógica async de Storage en un Observable para integrarlo con HttpClient
    return new Observable(observer => {
      (async () => {
        try {
          let imageUrl = news.imageUrl;

          // 1. Gestionar Imagen si hay archivo nuevo
          if (file) {
            this.logger.log('[NewsService] Subiendo nueva imagen a Storage...');
            imageUrl = await this.storageService.uploadImage(file, 'news');
            
            // Borrado preventivo de la antigua (si aplica)
            if (isEdit && oldImageUrl && oldImageUrl.includes('firebasestorage') && oldImageUrl !== imageUrl) {
              await this.storageService.deleteImageByUrl(oldImageUrl, 'news');
            }
          } 
          else if (!imageUrl && oldImageUrl && oldImageUrl.includes('firebasestorage')) {
            // Se ha quitado la imagen
            await this.storageService.deleteImageByUrl(oldImageUrl, 'news');
          }

          // 2. Preparar Payload Final
          const finalNews = this.normalizeNewsForApi({ ...news, imageUrl });
          
          // 3. Llamar a la API de Node (que llama a CORBA)
          const request$ = isEdit ? this.updateNews(finalNews) : this.addNews(finalNews);
          
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

  addNews(news: NewsItem): Observable<any> {
    const user = this.auth.currentUser;
    
    const payload = {
      ...this.normalizeNewsForApi(news),
      createdBy: user?.email || 'Anónimo',
      createdAt: new Date().toISOString()
    };
    
    return this.http.post(this.apiUrl, payload);
  }

  updateNews(news: NewsItem): Observable<any> {
    const user = this.auth.currentUser;

    const payload = {
      ...this.normalizeNewsForApi(news),
      updatedBy: user?.email || 'Anónimo',
      updatedAt: new Date().toISOString()
    };
    
    return this.http.put(`${this.apiUrl}/${news.id}`, payload);
  }

  deleteNews(id: string): Observable<any> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Carga masiva de noticias (Admin)
   */
  bulkAddNews(newsList: NewsItem[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk`, newsList.map(news => this.normalizeNewsForApi(news)));
  }
}
