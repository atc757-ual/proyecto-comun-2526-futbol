import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, idToken } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { firstValueFrom, map, Observable, switchMap, take, catchError, of, throwError } from 'rxjs';

export interface NewsItem {
  id?: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private apiUrl = environment.nodeApiUrl + '/news';
  private feedUrl = environment.nodeApiUrl + '/news'; 
  private featuredUrl = environment.nodeApiUrl + '/news'; 

  /**
   * Obtiene todas las noticias (Panel Admin)
   * Implementa PERSISTENCIA LOCAL (JSON) como respaldo
   */
  getNews(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });

    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(response => {
        const processed = this.processNewsResponse(response.data);
        if (processed && processed.length > 0) {
          localStorage.setItem('cached_news_admin', JSON.stringify(processed));
        }
        return processed;
      }),
      catchError((err: any) => {
        console.error('[NewsService] Error crítico de conexión con el servidor CORBA:', err);
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
        const processed = this.processNewsResponse(response.data);
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
      map(response => this.processNewsResponse(response.data))
    );
  }

  /**
   * Procesa la respuesta de noticias y formatea fechas
   */
  private processNewsResponse(newsItems: NewsItem[]): NewsItem[] {
    if (!newsItems) return [];
    
    const processed = newsItems.map(item => {
      if (item.date && item.date.includes('/')) {
        const [day, month, year] = item.date.split('/');
        item.date = `${year}-${month}-${day}`;
      }
      return item;
    });

    return processed.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }

  /**
   * Obtiene una noticia por ID (Con respaldo en caché local)
   */
  getNewsById(id: string): Observable<NewsItem | null> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });

    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        const item = response.data;
        if (item && item.date && item.date.includes('/')) {
          const [day, month, year] = item.date.split('/');
          item.date = `${year}-${month}-${day}`;
        }
        return item as NewsItem;
      }),
      catchError((err: any) => {
        console.warn(`[NewsService] Error al obtener noticia ${id}, buscando en caché local...`);
        const cachedStr = localStorage.getItem('cached_news_admin');
        if (cachedStr) {
          const cachedNews: NewsItem[] = JSON.parse(cachedStr);
          const found = cachedNews.find(n => n.id === id);
          if (found) return of(found);
        }
        return of(null);
      })
    );
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
