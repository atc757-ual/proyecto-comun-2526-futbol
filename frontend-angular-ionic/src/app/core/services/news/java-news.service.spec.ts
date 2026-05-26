import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Auth } from '@angular/fire/auth';
import { JavaNewsService } from './java-news.service';
import { StorageService } from '../system/storage.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';

const authMock = {
  currentUser: null,
  authStateReady: () => Promise.resolve(),
  _onAuthStateChanged: (cb: any) => { cb(null); return () => {}; },
  _getRecaptchaConfig: () => null,
};
const storageMock = { uploadImage: jasmine.createSpy().and.returnValue(Promise.resolve('url')), deleteImageByUrl: jasmine.createSpy().and.returnValue(Promise.resolve()) };
const authServiceMock = { currentUser: () => null };

describe('JavaNewsService', () => {
  let service: JavaNewsService;
  let http: HttpTestingController;
  const base = `${environment.javaApiUrl}/news`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        JavaNewsService,
        { provide: Auth, useValue: authMock },
        { provide: StorageService, useValue: storageMock },
        { provide: AuthService, useValue: authServiceMock },
      ]
    });
    service = TestBed.inject(JavaNewsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getNews() should call java news API', () => {
    service.getNews().subscribe(res => expect(res).toEqual([]));
    http.expectOne(r => r.url === base).flush({ data: [] });
  });

  it('getFeed() should call /news/feed', () => {
    service.getFeed().subscribe(res => expect(Array.isArray(res)).toBeTrue());
    http.expectOne(`${base}/feed`).flush({ data: [] });
  });

  it('getNewsById() should call /news/:id', () => {
    service.getNewsById('1').subscribe();
    http.expectOne(`${base}/1`).flush({ data: { id: '1' } });
  });

  it('mapToNews() should normalize date and isActive', () => {
    const result = service.mapToNews({ date: '01/01/2024', isActive: true, _id: 'x' });
    expect(result.date).toBe('2024-01-01');
    expect(result.isActive).toBeTrue();
    expect(result.id).toBe('x');
  });
});
