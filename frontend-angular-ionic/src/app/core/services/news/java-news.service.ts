import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom, map, Observable, catchError, of, throwError } from 'rxjs';
import { normalizeNewsForApi, mapDateFromCorba } from './news.utils';
import { INewsService } from './news.service.interface';
import { NewsItem } from '../../models/news.model';

/**
 * Implementación del servicio de noticias para el Backend en Java (Spring Boot)
 * Se conecta al Bridge CORBA a través del Gateway de Java.
 */
@Injectable({ providedIn: 'root' })
export class JavaNewsService implements INewsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  
  private apiUrl = environment.javaApiUrl + '/news';

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

  getNews(): Observable<NewsItem[]> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });

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
    return this.http.get<any>(`${this.apiUrl}/featured`).pipe(
      map(response => (response.data || []).map((n: any) => this.mapToNews(n))),
      catchError(() => of([]))
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
          const finalNews = this.normalizeNewsForApi({ ...news, imageUrl });
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
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });
    return this.http.post(this.apiUrl, this.normalizeNewsForApi(news), { headers });
  }

  updateNews(news: NewsItem): Observable<any> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });
    return this.http.put(`${this.apiUrl}/${news.id}`, this.normalizeNewsForApi(news), { headers });
  }

  deleteNews(id: string): Observable<any> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  bulkAddNews(newsList: NewsItem[]): Observable<any> {
    const headers = new HttpHeaders({ 'X-User-Role': this.getUserRoleHeader() });
    return this.http.post(
      `${this.apiUrl}/bulk`,
      newsList.map(news => this.normalizeNewsForApi(news)),
      { headers }
    );
  }

  mapToNews(item: any): NewsItem {
    if (!item) return {} as NewsItem;
    const news = { ...item };
    news.id = item.id || item._id;
    news.date = mapDateFromCorba(news.date) || news.date;
    news.expiryDate = mapDateFromCorba(news.expiryDate) || news.expiryDate;
    news.isActive = (item.isActive === true || item.isActive === 1 || item.isActive === 'true' || item.active === true);
    return news as NewsItem;
  }
}
