import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsPage } from './news.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { ActivatedRoute } from '@angular/router';
import { NavController, LoadingController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { NewsItem } from '../../../core/models/news.model';

const mockNews: NewsItem[] = [
  { id: '1', title: 'News 1', content: 'Content 1', summary: '', author: 'A', date: '2025-01-01', category: 'fichajes', tags: [], isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01', imageUrl: '', isFeatured: false },
  { id: '2', title: 'News 2', content: 'Content 2', summary: '', author: 'B', date: '2025-01-02', category: 'internacional', tags: [], isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01', imageUrl: '', isFeatured: false }
];

const mockNewsService = {
  getFeed: jasmine.createSpy('getFeed').and.returnValue(of(mockNews)),
  getFeatured: jasmine.createSpy('getFeatured').and.returnValue(of([mockNews[0]]))
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
  showError: jasmine.createSpy('showError'),
  showSuccess: jasmine.createSpy('showSuccess')
};

const mockNavCtrl = {
  navigateForward: jasmine.createSpy('navigateForward')
};

const mockLoadingCtrl = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
  }))
};

describe('NewsPage', () => {
  let component: NewsPage;
  let fixture: ComponentFixture<NewsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsPage],
      providers: [
        { provide: NEWS_SERVICE_TOKEN, useValue: mockNewsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: PlatformService, useValue: mockPlatformService },
        { provide: ToastService, useValue: mockToastService },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: LoadingController, useValue: mockLoadingCtrl },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NewsPage);
    component = fixture.componentInstance;
    mockNewsService.getFeed.calls.reset();
    mockNewsService.getFeatured.calls.reset();
  });

  it('should create and load news', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockNewsService.getFeed).toHaveBeenCalled();
    expect(mockNewsService.getFeatured).toHaveBeenCalled();
    expect(component.totalNews.length).toBe(2);
    expect(component.featuredNews.length).toBe(1);
  });

  it('should calculate pages correctly', () => {
    component.totalNews = Array.from({ length: 12 }, (_, i) => ({ id: `${i}` } as any));
    component.itemsPerPage = 5;
    component.updateVisibleNews();
    component.totalPages = Math.ceil(component.totalNews.length / component.itemsPerPage);
    
    expect(component.totalPages).toBe(3);
    expect(component.getPages()).toEqual([1, 2, 3]);
  });

  it('should navigate to news detail', () => {
    const news = mockNews[0];
    component.selectNews(news);
    expect(mockNavCtrl.navigateForward).toHaveBeenCalledWith(['/news', news.id]);
  });
});
