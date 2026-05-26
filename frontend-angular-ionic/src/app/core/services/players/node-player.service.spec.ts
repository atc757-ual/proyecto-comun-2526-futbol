import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NodePlayerService } from './node-player.service';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { LoggerService } from '../system/logger.service';
import { environment } from '../../../../environments/environment';

const storageMock = {
  uploadImage: jasmine.createSpy().and.returnValue(Promise.resolve('http://img.url')),
  deleteImageByUrl: jasmine.createSpy().and.returnValue(Promise.resolve()),
};
const authServiceMock = {
  currentUser: () => ({ uid: 'uid-1', email: 'test@test.com' }),
  getUID: () => 'uid-1',
  isAdmin: () => false,
};
const loggerMock = { log: jasmine.createSpy(), warn: jasmine.createSpy(), error: jasmine.createSpy() };

describe('NodePlayerService', () => {
  let service: NodePlayerService;
  let http: HttpTestingController;
  const base = `${environment.nodeApiUrl}/players`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NodePlayerService,
        { provide: StorageService, useValue: storageMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerMock },
      ]
    });
    service = TestBed.inject(NodePlayerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPlayers() should make GET and return sorted players', () => {
    const players = [{ name: 'A', isFeatured: false }, { name: 'B', isFeatured: true }];
    service.getPlayers().subscribe(res => expect(res[0].name).toBe('B'));
    http.expectOne(base).flush({ data: players });
  });

  it('getPublicPlayers() should call /players/public', () => {
    service.getPublicPlayers().subscribe(res => expect(res).toEqual([]));
    http.expectOne(`${base}/public`).flush({ data: [] });
  });

  it('getPlayer() should call /players/:id', () => {
    service.getPlayer('123').subscribe(res => expect(res.name).toBe('Messi'));
    http.expectOne(`${base}/123`).flush({ data: { name: 'Messi' } });
  });

  it('deletePlayer() should make DELETE to /players/:id', () => {
    service.deletePlayer('123').subscribe();
    http.expectOne({ method: 'DELETE', url: `${base}/123` }).flush(null);
  });

  it('mapTSDBToPlayer() should map API data to player model', () => {
    const details = {
      strPlayer: 'Messi', strTeam: 'Inter Miami', strNationality: 'Argentina',
      strPosition: 'Forward', idPlayer: '999', dateBorn: '1987-06-24'
    };
    const result = service.mapTSDBToPlayer(details);
    expect(result.name).toBe('Messi');
    expect(result.team).toBe('Inter Miami');
    expect(result.age).toBeGreaterThan(0);
  });
});
