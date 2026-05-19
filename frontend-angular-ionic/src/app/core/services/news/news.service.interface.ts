import { Observable } from 'rxjs';
import { NewsItem } from '../../models/news.model';

export interface INewsService {
  getNews(): Observable<NewsItem[]>;
  getFeed(): Observable<NewsItem[]>;
  getFeatured(): Observable<NewsItem[]>;
  getNewsById(id: string): Observable<NewsItem | null>;
  saveNews(news: NewsItem, file: File | null, oldImageUrl: string | null): Observable<any>;
  addNews(news: NewsItem): Observable<any>;
  updateNews(news: NewsItem): Observable<any>;
  deleteNews(id: string): Observable<any>;
  bulkAddNews(newsList: NewsItem[]): Observable<any>;
  mapToNews(item: any): NewsItem;
}
