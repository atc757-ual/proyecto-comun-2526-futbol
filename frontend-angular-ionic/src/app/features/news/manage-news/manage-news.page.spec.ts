import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ManageNewsPage } from './manage-news.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { NavController } from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { ModalController } from '@ionic/angular/standalone';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from '../../../core/services/system/storage.service';
import { of, throwError } from 'rxjs';
import { NewsItem } from '../../../core/models/news.model';

const mockNews: NewsItem[] = [
  { id: '1', title: 'News 1', content: 'Content 1', summary: '', author: 'Author 1', date: '2025-01-01', category: 'General', tags: [], isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01', imageUrl: '', isFeatured: false },
  { id: '2', title: 'News 2', content: 'Content 2', summary: '', author: 'Author 2', date: '2025-01-02', category: 'Fichajes', tags: [], isActive: false, createdAt: '2025-01-01', updatedAt: '2025-01-01', imageUrl: '', isFeatured: false }
];

const mockNewsService = {
  getNews: jasmine.createSpy('getNews').and.returnValue(of(mockNews)),
  deleteNews: jasmine.createSpy('deleteNews').and.returnValue(of({})),
  bulkAddNews: jasmine.createSpy('bulkAddNews').and.returnValue(of({}))
};

const mockAuthService = {
  isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true),
  currentUser: jasmine.createSpy('currentUser').and.returnValue({ email: 'admin@test.com' }),
  userData: jasmine.createSpy('userData').and.returnValue({ name: 'Admin User' })
};

const mockLayoutService = {
  setHeader: jasmine.createSpy('setHeader'),
  setBreadcrumbs: jasmine.createSpy('setBreadcrumbs')
};

const mockToastService = {
  showSuccess: jasmine.createSpy('showSuccess'),
  showError: jasmine.createSpy('showError'),
  showWarning: jasmine.createSpy('showWarning').and.returnValue(Promise.resolve())
};

const mockNavCtrl = {
  navigateForward: jasmine.createSpy('navigateForward')
};

const mockModalCtrl = {
  create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    onWillDismiss: jasmine.createSpy('onWillDismiss').and.returnValue(Promise.resolve({ data: true }))
  }))
};

const mockStorageService = {
  deleteImageByUrl: jasmine.createSpy('deleteImageByUrl').and.returnValue(Promise.resolve())
};

describe('ManageNewsPage', () => {
  let component: ManageNewsPage;
  let fixture: ComponentFixture<ManageNewsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageNewsPage],
      providers: [
        { provide: NEWS_SERVICE_TOKEN, useValue: mockNewsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ToastService, useValue: mockToastService },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Auth, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageNewsPage);
    component = fixture.componentInstance;
    mockNewsService.getNews.calls.reset();
    mockNewsService.deleteNews.calls.reset();
    mockNewsService.bulkAddNews.calls.reset();
    mockToastService.showSuccess.calls.reset();
    mockToastService.showError.calls.reset();
    mockModalCtrl.create.calls.reset();
    mockNavCtrl.navigateForward.calls.reset();
  });

  it('should create and load news', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockNewsService.getNews).toHaveBeenCalled();
    expect(component.news.length).toBe(2);
    expect(component.filteredNews.length).toBe(2);
  });

  it('should filter news by title', () => {
    fixture.detectChanges();
    component.searchTerm = 'News 1';
    component.applyFilter();
    expect(component.filteredNews.length).toBe(1);
    expect(component.filteredNews[0].title).toBe('News 1');
  });

  it('should go to edit page', () => {
    component.editNews(mockNews[0]);
    expect(mockNavCtrl.navigateForward).toHaveBeenCalledWith(['/edit-news', '1']);
  });

  it('should view news', () => {
    component.viewNews(mockNews[0]);
    expect(mockNavCtrl.navigateForward).toHaveBeenCalledWith(['/news', '1']);
  });

  it('should confirm and delete news', fakeAsync(() => {
    fixture.detectChanges();
    component.deleteNews(mockNews[0]);
    tick(); // Wait for modal promise
    expect(mockModalCtrl.create).toHaveBeenCalled();
    expect(mockNewsService.deleteNews).toHaveBeenCalledWith('1');
    expect(mockNewsService.getNews).toHaveBeenCalledTimes(2); // 1 on init, 1 after delete
  }));

  it('should handle pagination', () => {
    fixture.detectChanges();
    component.itemsPerPage = 1;
    component.applyFilter();
    expect(component.totalPages).toBe(2);
    expect(component.getPages()).toEqual([1, 2]);
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(component.pagedNews.length).toBe(1);
    expect(component.pagedNews[0].title).toBe('News 2');
  });
});

afterEach(() => {
  TestBed.resetTestingModule();
});
