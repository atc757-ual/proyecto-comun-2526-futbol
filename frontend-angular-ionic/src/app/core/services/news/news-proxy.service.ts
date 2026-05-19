import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { INewsService } from './news.service.interface';
import { NodeNewsService } from './node-news.service';
import { JavaNewsService } from './java-news.service';
import { PlatformService } from '../system/platform.service';
import { NewsItem } from '../../models/news.model';

@Injectable({ providedIn: 'root' })
export class NewsProxyService implements INewsService {
  private nodeService = inject(NodeNewsService);
  private javaService = inject(JavaNewsService);
  private platformService = inject(PlatformService);

  private get activeService(): INewsService {
    return this.platformService.getUseJavaBackend() ? this.javaService : this.nodeService;
  }

  getNews(): Observable<NewsItem[]> {
    return this.activeService.getNews();
  }

  getFeed(): Observable<NewsItem[]> {
    return this.activeService.getFeed();
  }

  getFeatured(): Observable<NewsItem[]> {
    return this.activeService.getFeatured();
  }

  getNewsById(id: string): Observable<NewsItem | null> {
    return this.activeService.getNewsById(id);
  }

  saveNews(news: NewsItem, file: File | null, oldImageUrl: string | null): Observable<any> {
    return this.activeService.saveNews(news, file, oldImageUrl);
  }

  addNews(news: NewsItem): Observable<any> {
    return this.activeService.addNews(news);
  }

  updateNews(news: NewsItem): Observable<any> {
    return this.activeService.updateNews(news);
  }

  deleteNews(id: string): Observable<any> {
    return this.activeService.deleteNews(id);
  }

  bulkAddNews(newsList: NewsItem[]): Observable<any> {
    return this.activeService.bulkAddNews(newsList);
  }

  mapToNews(item: any): NewsItem {
    return this.activeService.mapToNews(item);
  }
}
