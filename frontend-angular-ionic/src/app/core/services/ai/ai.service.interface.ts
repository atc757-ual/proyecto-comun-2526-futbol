import { Observable } from 'rxjs';

export interface AIPlayer {
  name: string;
  position: string;
  role: string;
  image_url?: string;
}

export interface AIAnalysisResponse {
  analysis: string;
  formation: string;
  idealEleven: AIPlayer[];
  starPlayer: string;
  starPlayerImage?: string;
  justification: string;
  tacticalRecommendations: string[];
}

export interface IAIService {
  analyzeMyTeam(): Observable<AIAnalysisResponse>;
}
