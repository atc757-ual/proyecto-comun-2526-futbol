import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { firstValueFrom, map, Observable, switchMap, take, catchError, of, throwError } from 'rxjs';

import { NewsItem } from '../models/news.model';
export { NewsItem };

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private apiUrl = environment.nodeApiUrl + '/news';
  private feedUrl = environment.nodeApiUrl + '/news'; 
  private featuredUrl = environment.nodeApiUrl + '/news'; 

  /**
   * Obtiene todas las noticias (Panel Admin)
   */
  getNews(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });

    return this.http.get<any>(`${this.apiUrl}?all=true`, { headers }).pipe(
      map(response => {
        const processed = (response.data || []).map((n: any) => this.mapToNews(n));
        localStorage.setItem('cached_news_admin', JSON.stringify(processed));
        return processed;
      }),
      catchError((err: any) => {
        console.error('[NewsService] Error crítico de conexión:', err);
        return throwError(() => new Error('No se pudo conectar con el servidor de noticias'));
      })
    );
  }

  /**
   * Obtiene solo las noticias activas (Público)
   */
  getFeed(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'USER'
    });
    return this.http.get<any>(this.feedUrl, { headers }).pipe(
      map(response => {
        const processed = (response.data || []).map((n: any) => this.mapToNews(n));
        localStorage.setItem('cached_news_feed', JSON.stringify(processed));
        return processed;
      }),
      catchError(() => {
        const cached = localStorage.getItem('cached_news_feed');
        return of(cached ? JSON.parse(cached) : []);
      })
    );
  }

  /**
   * Obtiene solo las noticias destacadas
   */
  getFeatured(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'USER'
    });
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
    if (news.date && news.date.includes('/')) {
      const [day, month, year] = news.date.split('/');
      news.date = `${year}-${month}-${day}`;
    }

    // NORMALIZACIÓN DE ESTADO (Crucial para el diseño)
    // Aceptamos true, 1 (CORBA), o "true" (String)
    news.isActive = (item.isActive === true || item.isActive === 1 || item.isActive === 'true' || item.active === true);

    return news as NewsItem;
  }

  /**
   * Obtiene una noticia por ID
   */
  getNewsById(id: string): Observable<NewsItem | null> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });

    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => this.mapToNews(response.data)),
      catchError((err: any) => {
        console.warn(`[NewsService] Error al obtener noticia ${id}, buscando en caché local...`);
        const cachedStr = localStorage.getItem('cached_news_admin');
        if (cachedStr) {
          const cachedNews: NewsItem[] = JSON.parse(cachedStr);
          const found = cachedNews.find(n => n.id === id || (n as any)._id === id);
          if (found) return of(this.mapToNews(found));
        }
        return of(null);
      })
    );
  }

  private storageService = inject(StorageService);

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
            console.log('[NewsService] Subiendo nueva imagen a Storage...');
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
          const finalNews = { ...news, imageUrl };
          
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
    const token = localStorage.getItem('jwt_token');
    const user = this.auth.currentUser;
    
    const payload = {
      ...news,
      createdBy: user?.email || 'Anónimo',
      createdAt: new Date().toISOString()
    };
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(this.apiUrl, payload, { headers });
  }

  updateNews(news: NewsItem): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const user = this.auth.currentUser;

    const payload = {
      ...news,
      updatedBy: user?.email || 'Anónimo',
      updatedAt: new Date().toISOString()
    };
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.apiUrl}/${news.id}`, payload, { headers });
  }

  deleteNews(id: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Carga masiva de noticias (Admin)
   */
  bulkAddNews(newsList: NewsItem[]): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/bulk`, newsList, { headers });
  }
}
