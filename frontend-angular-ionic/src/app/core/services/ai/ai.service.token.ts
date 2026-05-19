import { InjectionToken } from '@angular/core';
import { IAIService } from './ai.service.interface';

export const AI_SERVICE_TOKEN = new InjectionToken<IAIService>('AI_SERVICE_TOKEN');
