import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { firstValueFrom, map, Observable, catchError, of, throwError } from 'rxjs';
import { INewsService } from './news.service.interface';
import { NewsItem } from '../models/news.model';

/**
 * Implementación del servicio de noticias para el Backend en Java (Spring Boot)
 * Se conecta al Bridge CORBA a través del Gateway de Java.
 */
@Injectable({ providedIn: 'root' })
export class JavaNewsService implements INewsService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private storageService = inject(StorageService);
  
  private apiUrl = environment.javaApiUrl + '/news';

  getNews(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });

    return this.http.get<any>(this.apiUrl, { headers, params: { all: 'true' } }).pipe(
      map(response => (response.data || []).map((n: any) => this.mapToNews(n))),
      catchError(err => throwError(() => new Error('Error en conexión Java News')))
    );
  }

  getFeed(): Observable<NewsItem[]> {
    return this.http.get<any>(`${this.apiUrl}/feed`).pipe(
      map(response => (response.data || []).map((n: any) => this.mapToNews(n))),
      catchError(() => of([]))
    );
  }

  getFeatured(): Observable<NewsItem[]> {
    // En Java usamos el mismo feed pero filtrado por importancia si aplica
    return this.getFeed().pipe(
      map(news => news.filter(n => n.isActive))
    );
  }

  getNewsById(id: string): Observable<NewsItem | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapToNews(response.data)),
      catchError(() => of(null))
    );
  }

  saveNews(news: NewsItem, file: File | null, oldImageUrl: string | null): Observable<any> {
    const isEdit = !!news.id;
    return new Observable(observer => {
      (async () => {
        try {
          let imageUrl = news.imageUrl;
          if (file) {
            imageUrl = await this.storageService.uploadImage(file, 'news');
            if (isEdit && oldImageUrl && oldImageUrl.includes('firebasestorage')) {
              await this.storageService.deleteImageByUrl(oldImageUrl, 'news');
            }
          }
          const finalNews = { ...news, imageUrl };
          const request$ = isEdit ? this.updateNews(finalNews) : this.addNews(finalNews);
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

  addNews(news: NewsItem): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'X-User-Role': 'ADMIN' });
    return this.http.post(this.apiUrl, news, { headers });
  }

  updateNews(news: NewsItem): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'X-User-Role': 'ADMIN' });
    return this.http.put(`${this.apiUrl}/${news.id}`, news, { headers });
  }

  deleteNews(id: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'X-User-Role': 'ADMIN' });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  bulkAddNews(newsList: NewsItem[]): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'X-User-Role': 'ADMIN' });
    return this.http.post(`${this.apiUrl}/bulk`, newsList, { headers });
  }

  mapToNews(item: any): NewsItem {
    if (!item) return {} as NewsItem;
    const news = { ...item };
    news.id = item.id || item._id;
    if (news.date && news.date.includes('/')) {
      const [day, month, year] = news.date.split('/');
      news.date = `${year}-${month}-${day}`;
    }
    news.isActive = (item.isActive === true || item.isActive === 1 || item.isActive === 'true' || item.active === true);
    return news as NewsItem;
  }
}
