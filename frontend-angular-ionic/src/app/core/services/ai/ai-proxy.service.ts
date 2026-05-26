import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IAIService, AIAnalysisResponse } from './ai.service.interface';
import { NodeAIService } from './node-ai.service';
import { JavaAIService } from './java-ai.service';
import { PlatformService } from '../system/platform.service';

@Injectable({ providedIn: 'root' })
export class AIProxyService implements IAIService {
  private readonly nodeService = inject(NodeAIService);
  private readonly javaService = inject(JavaAIService);
  private readonly platformService = inject(PlatformService);

  private get activeService(): IAIService {
    return this.platformService.getUseJavaBackend() ? this.javaService : this.nodeService;
  }

  analyzeMyTeam(): Observable<AIAnalysisResponse> {
    return this.activeService.analyzeMyTeam();
  }
}
