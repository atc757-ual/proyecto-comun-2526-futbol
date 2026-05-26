import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JavaAIService } from './java-ai.service';
import { environment } from '../../../../environments/environment';

describe('JavaAIService', () => {
  let service: JavaAIService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('jwt_token', 'test.token.payload');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JavaAIService]
    });
    service = TestBed.inject(JavaAIService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('analyzeMyTeam() should POST to /ai/analyze with Authorization header', () => {
    const mockResponse = {
      analysis: 'Análisis Java',
      formation: '4-4-2',
      idealEleven: [{ name: 'Ronaldo', position: 'DEL', role: 'Delantero' }],
      starPlayer: 'Ronaldo',
      justification: 'Velocidad y gol',
      tacticalRecommendations: ['Contraataque']
    };
    service.analyzeMyTeam().subscribe(res => expect(res).toEqual(mockResponse));
    const req = http.expectOne(`${environment.javaApiUrl}/ai/analyze`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toContain('Bearer');
    req.flush({ data: mockResponse });
  });
});
