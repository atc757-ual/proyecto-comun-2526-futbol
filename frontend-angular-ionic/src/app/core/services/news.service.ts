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
  private apiUrl = environment.corbaApiUrl + '/noticias';
  private feedUrl = environment.corbaApiUrl + '/noticias/feed';
  private featuredUrl = environment.corbaApiUrl + '/noticias/featured'; // Nuevo

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

  getNews(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(response => this.processNewsResponse(response.data))
    );
  }

  /**
   * Obtiene solo las noticias activas (Público)
   * Usa el nuevo endpoint discreto /feed
   */
  getFeed(): Observable<NewsItem[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'USER'
    });
    return this.http.get<any>(this.feedUrl, { headers }).pipe(
      map(response => this.processNewsResponse(response.data))
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
    
    // 1. Formatear fechas a YYYY-MM-DD para que sean ordenables y legibles por HTML5
    const processed = newsItems.map(item => {
      // 1. FORMATEAR FECHAS (IMPORTANTE PARA EL ORDEN)
      if (item.date && item.date.includes('/')) {
        const [day, month, year] = item.date.split('/');
        item.date = `${year}-${month}-${day}`;
      }
      
      return item;
    });

    // 2. Ordenar descendente (más reciente primero)
    return processed.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }

  /**
   * Obtiene una noticia por ID
   */
  getNewsById(id: string): Observable<NewsItem> {
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
        return item;
      })
    );
  }

  /**
   * Registra una nueva noticia
   */
  addNews(news: NewsItem): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    
    // Limpiamos el objeto para que coincida exactamente con el IDL de CORBA
    // Eliminamos 'pseudonym' y aseguramos que todos los campos obligatorios existan
    // Formateamos la fecha de YYYY-MM-DD a DD/MM/YYYY para cumplir con el XSD de CORBA
    let formattedDate = news.date || new Date().toISOString().split('T')[0];
    
    // Si viene de ion-datetime, puede traer la T de ISO (ej: 2024-05-09T10:00:00)
    // Nos quedamos solo con la parte de la fecha YYYY-MM-DD
    if (formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }

    if (formattedDate.includes('-')) {
      const [year, month, day] = formattedDate.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }

    // Limpiamos el objeto para que coincida exactamente con el IDL de CORBA
    const cleanedNews: any = {
      id: (news.id || `news-${Date.now()}`).trim(),
      title: (news.title || '').trim(),
      author: (news.author || 'Anónimo').trim(),
      content: (news.content || '').trim(),
      summary: (news.summary || '').trim(),
      imageUrl: (news.imageUrl || '').trim(),
      category: (news.category || 'General').trim(),
      tags: (news.tags && news.tags.length > 0) ? news.tags.map(t => t.trim()) : ['General'],
      date: formattedDate.trim(),
      isActive: news.isActive !== undefined ? news.isActive : true,
      isFeatured: news.isFeatured !== undefined ? news.isFeatured : false
    };

    // Asegurar que no excedemos los 6 tags
    cleanedNews.tags = cleanedNews.tags ? cleanedNews.tags.slice(0, 6) : ['General'];

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'X-User-Role': 'ADMIN'
    });

    return this.http.post(this.apiUrl, cleanedNews, { headers });
  }

  /**
   * Actualiza una noticia existente
   */
  updateNews(news: NewsItem): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    
    let formattedDate = news.date || new Date().toISOString().split('T')[0];
    
    // Limpiar ISO string si viene de ion-datetime
    if (formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }

    if (formattedDate.includes('-')) {
      const [year, month, day] = formattedDate.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }

    const cleanedNews: any = {
      id: news.id,
      title: (news.title || '').trim(),
      author: (news.author || 'Anónimo').trim(),
      content: (news.content || '').trim(),
      summary: (news.summary || '').trim(),
      imageUrl: (news.imageUrl || '').trim(),
      category: (news.category || 'General').trim(),
      tags: (news.tags && news.tags.length > 0) ? news.tags.map(t => t.trim()) : ['General'],
      date: formattedDate.trim(),
      isActive: news.isActive !== undefined ? news.isActive : true,
      isFeatured: news.isFeatured !== undefined ? news.isFeatured : false
    };

    // Asegurar que no excedemos los 6 tags
    cleanedNews.tags = cleanedNews.tags ? cleanedNews.tags.slice(0, 6) : ['General'];

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'X-User-Role': 'ADMIN'
    });

    return this.http.put(`${this.apiUrl}/${news.id}`, cleanedNews, { headers });
  }

  /**
   * Elimina una noticia por ID
   */
  deleteNews(id: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'X-User-Role': 'ADMIN'
    });
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
    <isFeatured>${news.isFeatured !== undefined ? news.isFeatured : false}</isFeatured>
    <tags>
${tagsXml || '        <tag>General</tag>'}
    </tags>
</noticia>`;
  }
}
