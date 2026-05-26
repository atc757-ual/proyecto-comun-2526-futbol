export interface Comment {
  _id?: string;
  id?: string;
  content: string;
  rating: number;
  autor_name: string;
  user_id: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  created_at?: Date | string;
  updated_at?: Date | string;
  user_name?: string;
  author_name?: string;
  entryDate?: Date | string;
}

export interface CommentPayload {
  content: string;
  rating: number;
  autor_name: string;
  user_id: string;
  location?: {
    type: string;
    coordinates: number[];
  };
}
