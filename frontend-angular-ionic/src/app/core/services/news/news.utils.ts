import { NewsItem } from '../../models/news.model';

export const FALLBACK_NEWS_IMG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">' +
  '<rect width="800" height="450" fill="#e2e8f0"/>' +
  '<rect x="260" y="120" width="280" height="210" rx="12" fill="#94a3b8"/>' +
  '<rect x="280" y="140" width="240" height="130" rx="6" fill="#cbd5e1"/>' +
  '<rect x="280" y="285" width="160" height="16" rx="4" fill="#64748b"/>' +
  '<rect x="280" y="310" width="110" height="12" rx="4" fill="#94a3b8"/>' +
  '</svg>'
);

export function hasValidImage(imageUrl: string | undefined): boolean {
  if (!imageUrl) return false;
  if (imageUrl.startsWith('data:')) return false;
  return true;
}

export function normalizeDateToCorba(dateValue?: string): string {
  if (!dateValue) return '';
  if (dateValue.includes('-')) {
    const [year, month, day] = dateValue.split('T')[0].split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
  }
  return dateValue;
}

export function normalizeNewsForApi(news: NewsItem): NewsItem {
  return {
    ...news,
    date: normalizeDateToCorba(news.date),
    expiryDate: normalizeDateToCorba(news.expiryDate)
  };
}

export function mapDateFromCorba(dateStr: string | undefined): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}
