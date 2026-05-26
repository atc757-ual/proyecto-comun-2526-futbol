import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { JavaPlayerService } from './java-player.service';
import { environment } from '../../../../environments/environment';
import { configurePlayerTestBed, runCommonPlayerContractTests } from './player-service.mocks';

describe('JavaPlayerService', () => {
  let service: JavaPlayerService;
  let http: HttpTestingController;
  const base = `${environment.javaApiUrl}/players`;

  beforeEach(() => {
    configurePlayerTestBed(JavaPlayerService);
    service = TestBed.inject(JavaPlayerService);
    http = TestBed.inject(HttpTestingController);
  });

  runCommonPlayerContractTests(
    () => service,
    () => http,
    `${environment.javaApiUrl}/players`
  );

  it('getPlayers() should make GET and return sorted players', () => {
    service.getPlayers().subscribe(res => expect(Array.isArray(res)).toBeTrue());
    http.expectOne((req) => req.url === base).flush({ data: [] });
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
