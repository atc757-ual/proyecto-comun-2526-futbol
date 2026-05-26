import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NodeAIService } from './node-ai.service';
import { environment } from '../../../../environments/environment';

describe('NodeAIService', () => {
  let service: NodeAIService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NodeAIService]
    });
    service = TestBed.inject(NodeAIService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('analyzeMyTeam() should POST to /ai/analyze and return response data', () => {
    const mockResponse = {
      analysis: 'Tu equipo es sólido',
      formation: '4-3-3',
      idealEleven: [{ name: 'Messi', position: 'DEL', role: 'Delantero' }],
      starPlayer: 'Messi',
      justification: 'Gran técnica',
      tacticalRecommendations: ['Presión alta']
    };
    service.analyzeMyTeam().subscribe(res => expect(res).toEqual(mockResponse));
    const req = http.expectOne(`${environment.nodeApiUrl}/ai/analyze`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: mockResponse });
  });
});
