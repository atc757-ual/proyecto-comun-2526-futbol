import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PlayerProxyService } from './player-proxy.service';
import { NodePlayerService } from './node-player.service';
import { JavaPlayerService } from './java-player.service';
import { PlatformService } from '../system/platform.service';

const mockPlayer = { _id: '1', name: 'Messi', team: 'IM', user_id: 'uid' } as any;
const nodeMock = { getPlayers: jasmine.createSpy().and.returnValue(of([mockPlayer])), getAllPlayers: jasmine.createSpy().and.returnValue(of([])) };
const javaMock = { getPlayers: jasmine.createSpy().and.returnValue(of([])), getAllPlayers: jasmine.createSpy().and.returnValue(of([])) };

describe('PlayerProxyService', () => {
  let service: PlayerProxyService;

  function createService(useJava: boolean) {
    TestBed.configureTestingModule({
      providers: [
        PlayerProxyService,
        { provide: NodePlayerService, useValue: nodeMock },
        { provide: JavaPlayerService, useValue: javaMock },
        { provide: PlatformService, useValue: { getUseJavaBackend: () => useJava } },
      ]
    });
    service = TestBed.inject(PlayerProxyService);
  }

  it('should be created', () => {
    createService(false);
    expect(service).toBeTruthy();
  });

  it('should delegate to NodePlayerService when useJava is false', () => {
    createService(false);
    service.getPlayers().subscribe(res => expect(res[0].name).toBe('Messi'));
    expect(nodeMock.getPlayers).toHaveBeenCalled();
  });

  it('should delegate to JavaPlayerService when useJava is true', () => {
    createService(true);
    service.getPlayers().subscribe();
    expect(javaMock.getPlayers).toHaveBeenCalled();
  });
});
