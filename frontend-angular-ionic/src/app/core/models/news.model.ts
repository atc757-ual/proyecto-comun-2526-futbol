export interface NewsItem {
  id?: string;
  _id?: string; // Para compatibilidad con MongoDB
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

export type NewsCategory = 'Transferencias' | 'Partidos' | 'Entrevistas' | 'Club' | 'Juveniles' | 'Otros';
