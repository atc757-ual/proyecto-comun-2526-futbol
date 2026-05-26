import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NewsProxyService } from './news-proxy.service';
import { NodeNewsService } from './node-news.service';
import { JavaNewsService } from './java-news.service';
import { PlatformService } from '../system/platform.service';

const nodeMock = { getNews: jasmine.createSpy().and.returnValue(of([])), getFeed: jasmine.createSpy().and.returnValue(of([])), mapToNews: jasmine.createSpy().and.returnValue({}) };
const javaMock = { getNews: jasmine.createSpy().and.returnValue(of([])), getFeed: jasmine.createSpy().and.returnValue(of([])), mapToNews: jasmine.createSpy().and.returnValue({}) };

describe('NewsProxyService', () => {
  let service: NewsProxyService;

  function createService(useJava: boolean) {
    TestBed.configureTestingModule({
      providers: [
        NewsProxyService,
        { provide: NodeNewsService, useValue: nodeMock },
        { provide: JavaNewsService, useValue: javaMock },
        { provide: PlatformService, useValue: { getUseJavaBackend: () => useJava } },
      ]
    });
    service = TestBed.inject(NewsProxyService);
  }

  it('should be created', () => {
    createService(false);
    expect(service).toBeTruthy();
  });

  it('should delegate to NodeNewsService when useJava is false', () => {
    createService(false);
    service.getNews().subscribe();
    expect(nodeMock.getNews).toHaveBeenCalled();
  });

  it('should delegate to JavaNewsService when useJava is true', () => {
    createService(true);
    service.getFeed().subscribe();
    expect(javaMock.getFeed).toHaveBeenCalled();
  });
});
