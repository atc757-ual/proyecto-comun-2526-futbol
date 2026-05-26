import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JavaPlayerService } from './java-player.service';
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

describe('JavaPlayerService', () => {
  let service: JavaPlayerService;
  let http: HttpTestingController;
  const base = `${environment.javaApiUrl}/players`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        JavaPlayerService,
        { provide: StorageService, useValue: storageMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerMock },
      ]
    });
    service = TestBed.inject(JavaPlayerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPlayers() should make GET and return sorted players', () => {
    service.getPlayers().subscribe(res => expect(Array.isArray(res)).toBeTrue());
    http.expectOne((req) => req.url === base).flush({ data: [] });
  });

  it('getPublicPlayers() should call /players/public', () => {
    service.getPublicPlayers().subscribe(res => expect(res).toEqual([]));
    http.expectOne(`${base}/public`).flush({ data: [] });
  });

  it('getPlayer() should call /players/:id and load comments', () => {
    service.getPlayer('1').subscribe(res => expect(res.name).toBe('Messi'));
    http.expectOne(`${base}/1`).flush({ data: { id: 1, name: 'Messi', team: 'IM' } });
    http.expectOne((req) => req.url.includes('/comments/player/1')).flush({ data: [] });
  });

  it('deletePlayer() should make DELETE to /players/:id', () => {
    service.deletePlayer('1').subscribe();
    http.expectOne({ method: 'DELETE', url: `${base}/1` }).flush(null);
  });

  it('mapTSDBToPlayer() should map API data correctly', () => {
    const details = {
      strPlayer: 'Cristiano', strTeam: 'Al Nassr', strNationality: 'Portugal',
      idPlayer: '888', dateBorn: '1985-02-05'
    };
    const result = service.mapTSDBToPlayer(details);
    expect(result.name).toBe('Cristiano');
    expect(result.age).toBeGreaterThan(0);
  });
});
