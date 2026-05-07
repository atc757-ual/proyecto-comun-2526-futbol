import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, idToken } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { firstValueFrom, map, Observable, switchMap, take } from 'rxjs';

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
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private apiUrl = environment.corbaApiUrl + '/noticias';

  /**
   * Obtiene las cabeceras con el token de Firebase
   */
  private async getAuthHeaders(): Promise<HttpHeaders> {
    const user = await firstValueFrom(idToken(this.auth).pipe(take(1)));
    return new HttpHeaders({
      'Authorization': `Bearer ${user}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * Obtiene todas las noticias desde el bridge CORBA
   */
  getNews(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    console.log('[NEWS-DEBUG] Intentando cargar noticias...');
    console.log('[NEWS-DEBUG] Token encontrado en LocalStorage:', token ? (token.substring(0, 15) + '...') : 'NULL');
    
    if (!token) {
      console.error('[NEWS-DEBUG] ERROR: No hay token de Node.js disponible. ¿Has hecho login?');
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(response => {
        console.log('[NEWS-DEBUG] Respuesta del Bridge recibida con éxito');
        return response.data || [];
      })
    );
  }

  /**
   * Obtiene una noticia por ID
   */
  getNewsById(id: string): Observable<NewsItem> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Registra una nueva noticia
   */
  addNews(news: NewsItem): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(this.apiUrl, news, { headers });
  }

  /**
   * Elimina una noticia por ID
   */
  deleteNews(id: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
  /**
   * Convierte un objeto NewsItem a XML compatible con el bridge CORBA
   * Cumple estrictamente con noticias.xsd
   */
  private jsonToXml(news: NewsItem): string {
    const tagsXml = (news.tags || [])
      .slice(0, 6) // Máximo 6 tags según XSD
      .map(tag => `        <tag>${tag}</tag>`)
      .join('\n');

    // Formatear fecha a DD/MM/YYYY
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Asegurar que la categoría es válida según XSD (default: General)
    const validCategories = ['Fichajes', 'Resultados', 'Crónica', 'Opinión', 'Internacional', 'General'];
    const category = validCategories.includes(news.category) ? news.category : 'General';

    return `<?xml version="1.0" encoding="UTF-8"?>
<noticia>
    <id>${news.id || 'news-' + Date.now()}</id>
    <date>${formattedDate}</date>
    <title>${news.title}</title>
    <author>${news.author}</author>
    <summary>${news.summary}</summary>
    <content>${news.content}</content>
    <imageUrl>${news.imageUrl}</imageUrl>
    <category>${category}</category>
    <isActive>${news.isActive !== undefined ? news.isActive : true}</isActive>
    <tags>
${tagsXml || '        <tag>General</tag>'}
    </tags>
</noticia>`;
  }
}
