import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Auth } from '@angular/fire/auth';
import { NodeNewsService } from './node-news.service';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { LoggerService } from '../system/logger.service';
import { environment } from '../../../../environments/environment';

const authMock = {
  currentUser: null,
  authStateReady: () => Promise.resolve(),
  _onAuthStateChanged: (cb: any) => { cb(null); return () => {}; },
  _getRecaptchaConfig: () => null,
};
const storageMock = { uploadImage: jasmine.createSpy().and.returnValue(Promise.resolve('url')), deleteImageByUrl: jasmine.createSpy().and.returnValue(Promise.resolve()) };
const authServiceMock = { currentUser: () => null };
const loggerMock = { log: jasmine.createSpy(), warn: jasmine.createSpy(), error: jasmine.createSpy() };

describe('NodeNewsService', () => {
  let service: NodeNewsService;
  let http: HttpTestingController;
  const base = `${environment.nodeApiUrl}/news`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NodeNewsService,
        { provide: Auth, useValue: authMock },
        { provide: StorageService, useValue: storageMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerMock },
      ]
    });
    service = TestBed.inject(NodeNewsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getNews() should call API with all=true', () => {
    service.getNews().subscribe(res => expect(res).toEqual([]));
    const req = http.expectOne(`${base}?all=true`);
    req.flush({ data: [] });
  });

  it('getFeed() should call news API', () => {
    service.getFeed().subscribe(res => expect(res).toEqual([]));
    http.expectOne(r => r.url.includes('/news')).flush({ data: [] });
  });

  it('getNewsById() should call /news/:id', () => {
    service.getNewsById('abc').subscribe(res => expect(res?.id).toBe('abc'));
    http.expectOne(`${base}/abc`).flush({ data: { id: 'abc', title: 'Test' } });
  });

  it('mapToNews() should normalize DD/MM/YYYY date to YYYY-MM-DD', () => {
    const result = service.mapToNews({ date: '24/06/1987', isActive: true });
    expect(result.date).toBe('1987-06-24');
  });

  it('mapToNews() should normalize isActive from number 1', () => {
    const result = service.mapToNews({ isActive: 1 });
    expect(result.isActive).toBeTrue();
  });

  it('mapToNews() should set isActive false for 0', () => {
    const result = service.mapToNews({ isActive: 0 });
    expect(result.isActive).toBeFalse();
  });
});
