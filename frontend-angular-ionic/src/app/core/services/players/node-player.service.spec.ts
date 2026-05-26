import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { NodePlayerService } from './node-player.service';
import { environment } from '../../../../environments/environment';
import { configurePlayerTestBed, runCommonPlayerContractTests } from './player-service.mocks';

describe('NodePlayerService', () => {
  let service: NodePlayerService;
  let http: HttpTestingController;
  const base = `${environment.nodeApiUrl}/players`;

  beforeEach(() => {
    configurePlayerTestBed(NodePlayerService);
    service = TestBed.inject(NodePlayerService);
    http = TestBed.inject(HttpTestingController);
  });

  runCommonPlayerContractTests(
    () => service,
    () => http,
    `${environment.nodeApiUrl}/players`
  );

  it('getPlayers() should make GET and return sorted players', () => {
    const players = [{ name: 'A', isFeatured: false }, { name: 'B', isFeatured: true }];
    service.getPlayers().subscribe(res => expect(res[0].name).toBe('B'));
    http.expectOne(base).flush({ data: players });
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
