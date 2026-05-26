import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AIProxyService } from './ai-proxy.service';
import { NodeAIService } from './node-ai.service';
import { JavaAIService } from './java-ai.service';
import { PlatformService } from '../system/platform.service';

const mockResponse = { analysis: 'OK' } as any;
const nodeMock = { analyzeMyTeam: jasmine.createSpy().and.returnValue(of(mockResponse)) };
const javaMock = { analyzeMyTeam: jasmine.createSpy().and.returnValue(of(mockResponse)) };

describe('AIProxyService', () => {
  let service: AIProxyService;

  function createService(useJava: boolean) {
    TestBed.configureTestingModule({
      providers: [
        AIProxyService,
        { provide: NodeAIService, useValue: nodeMock },
        { provide: JavaAIService, useValue: javaMock },
        { provide: PlatformService, useValue: { getUseJavaBackend: () => useJava } },
      ]
    });
    service = TestBed.inject(AIProxyService);
  }

  it('should be created', () => {
    createService(false);
    expect(service).toBeTruthy();
  });

  it('should delegate analyzeMyTeam to node service when useJava is false', () => {
    createService(false);
    service.analyzeMyTeam().subscribe();
    expect(nodeMock.analyzeMyTeam).toHaveBeenCalled();
  });

  it('should delegate analyzeMyTeam to java service when useJava is true', () => {
    createService(true);
    service.analyzeMyTeam().subscribe();
    expect(javaMock.analyzeMyTeam).toHaveBeenCalled();
  });
});
