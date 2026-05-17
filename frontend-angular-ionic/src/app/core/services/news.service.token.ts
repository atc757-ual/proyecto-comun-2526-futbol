import { InjectionToken } from '@angular/core';
import { INewsService } from './news.service.interface';

export const NEWS_SERVICE_TOKEN = new InjectionToken<INewsService>('NEWS_SERVICE_TOKEN');
