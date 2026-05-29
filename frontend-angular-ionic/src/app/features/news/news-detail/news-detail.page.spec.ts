import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NewsDetailPage } from './news-detail.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { StorageService } from 'src/app/core/services/system/storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ModalController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { NewsItem } from '../../../core/models/news.model';

const mockNews: NewsItem = {
  id: '1', title: 'News 1', content: 'Content 1', summary: '', author: 'A', date: '2025-01-01', category: 'fichajes', tags: [], isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01', imageUrl: '', isFeatured: false
};

const mockNewsService = {
  getNewsById: jasmine.createSpy('getNewsById').and.returnValue(of(mockNews)),
  getFeatured: jasmine.createSpy('getFeatured').and.returnValue(of([mockNews])),
  updateNews: jasmine.createSpy('updateNews').and.returnValue(of({})),
  deleteNews: jasmine.createSpy('deleteNews').and.returnValue(of({}))
};

const mockAuthService = {
  isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true)
};

const mockLayoutService = {
  setHeader: jasmine.createSpy('setHeader'),
  setBreadcrumbs: jasmine.createSpy('setBreadcrumbs')
};

const mockPlatformService = {
  isDesktop: true
};

const mockToastService = {
  showSuccess: jasmine.createSpy('showSuccess').and.returnValue(Promise.resolve()),
  showError: jasmine.createSpy('showError').and.returnValue(Promise.resolve()),
  showWarning: jasmine.createSpy('showWarning').and.returnValue(Promise.resolve())
};

const mockNavCtrl = {
  navigateBack: jasmine.createSpy('navigateBack')
};

const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
  createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({ toString: () => '/news' }),
  serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/news')
};

const mockModalCtrl = {
  create: jasmine.createSpy('create').and.callFake(() => Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: true }))
  }))
};

const mockStorageService = {
  deleteImageByUrl: jasmine.createSpy('deleteImageByUrl').and.returnValue(Promise.resolve())
};

describe('NewsDetailPage', () => {
  let component: NewsDetailPage;
  let fixture: ComponentFixture<NewsDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsDetailPage, IonicModule.forRoot()],
      providers: [
        { provide: NEWS_SERVICE_TOKEN, useValue: mockNewsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: PlatformService, useValue: mockPlatformService },
        { provide: ToastService, useValue: mockToastService },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: Router, useValue: mockRouter },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NewsDetailPage);
    component = fixture.componentInstance;
    mockNewsService.getNewsById.calls.reset();
    mockNewsService.getFeatured.calls.reset();
    mockNewsService.updateNews.calls.reset();
    mockNewsService.deleteNews.calls.reset();
    mockToastService.showSuccess.calls.reset();
    mockToastService.showError.calls.reset();
  });

  it('should create and load data', () => {
    component.id = '1';
    expect(component).toBeTruthy();
    expect(mockNewsService.getNewsById).toHaveBeenCalledWith('1');
    expect(component.selectedNew).toEqual(mockNews);
  });

  it('should handle toggleVisibility', fakeAsync(() => {
    component.selectedNew = { ...mockNews, isActive: true };
    component.toggleVisibility();
    tick(100);
    fixture.detectChanges();
    tick(100);
    expect(mockNewsService.updateNews).toHaveBeenCalled();
    expect(component.selectedNew?.isActive).toBeFalse();
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  }));

  it('should delete news when confirmed', fakeAsync(() => {
    mockNewsService.deleteNews.calls.reset();
    component.selectedNew = { ...mockNews, imageUrl: 'firebasestorage.something' };
    spyOn(component as any, 'deleteNews').and.callThrough();
    (component as any).deleteNews();
    tick();
    expect(mockNewsService.deleteNews).toHaveBeenCalledWith('1');
  }));
});

afterEach(() => {
  TestBed.resetTestingModule();
});
