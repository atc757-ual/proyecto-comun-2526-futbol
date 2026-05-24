import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditNewsPage } from './add-edit-news.page';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { NavController } from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NewsItem } from '../../../core/models/news.model';

const mockNews: NewsItem = {
  id: '1', title: 'News 1', content: 'Content 1', summary: 'summary text here', author: 'A', date: '2025-01-01', category: 'fichajes', tags: ['tag1'], isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01', imageUrl: '', isFeatured: false
};

const mockNewsService = {
  getNewsById: jasmine.createSpy('getNewsById').and.returnValue(of(mockNews)),
  saveNews: jasmine.createSpy('saveNews').and.returnValue(of({}))
};

const mockAuthService = {
  getUserData: jasmine.createSpy('getUserData').and.returnValue({ name: 'Admin Name', email: 'admin@test.com' }),
  currentUser: jasmine.createSpy('currentUser').and.returnValue({ email: 'admin@test.com', displayName: 'Admin' } as any),
  userData: jasmine.createSpy('userData').and.returnValue({ name: 'Admin Name' }),
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
  showSuccess: jasmine.createSpy('showSuccess'),
  showError: jasmine.createSpy('showError'),
  showWarning: jasmine.createSpy('showWarning')
};

const mockNavCtrl = {
  navigateBack: jasmine.createSpy('navigateBack'),
  navigateRoot: jasmine.createSpy('navigateRoot'),
  back: jasmine.createSpy('back')
};

describe('AddEditNewsPage', () => {
  let component: AddEditNewsPage;
  let fixture: ComponentFixture<AddEditNewsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditNewsPage],
      providers: [
        { provide: NEWS_SERVICE_TOKEN, useValue: mockNewsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LayoutService, useValue: mockLayoutService },
        { provide: PlatformService, useValue: mockPlatformService },
        { provide: ToastService, useValue: mockToastService },
        { provide: NavController, useValue: mockNavCtrl },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: Auth, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditNewsPage);
    component = fixture.componentInstance;
    mockNewsService.getNewsById.calls.reset();
    mockNewsService.saveNews.calls.reset();
    mockToastService.showSuccess.calls.reset();
    mockToastService.showError.calls.reset();
    mockToastService.showWarning.calls.reset();
    mockNavCtrl.navigateRoot.calls.reset();
  });

  it('should create and load data in edit mode', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.isEditMode).toBeTrue();
    expect(mockNewsService.getNewsById).toHaveBeenCalledWith('1');
    expect(component.newsData.title).toBe('News 1');
  });

  it('should add a tag correctly', () => {
    component.tagInput = 'newTag';
    component.addTag();
    expect(component.newsData.tags).toContain('newTag');
    expect(component.tagInput).toBe('');
  });

  it('should not add duplicate tag', () => {
    component.newsData.tags = ['existing'];
    component.tagInput = 'existing';
    component.addTag();
    expect(component.tagError).toBe('Esta etiqueta ya ha sido añadida');
  });

  it('should remove a tag', () => {
    component.newsData.tags = ['tag1', 'tag2'];
    component.removeTag('tag1');
    expect(component.newsData.tags).toEqual(['tag2']);
  });

  it('should detect changes correctly', () => {
    fixture.detectChanges();
    // initially no changes
    expect(component.hasChanges).toBeFalse();
    // change title
    component.newsData.title = 'Updated Title';
    expect(component.hasChanges).toBeTrue();
  });

  it('should save news successfully', fakeAsync(() => {
    fixture.detectChanges();
    component.newsData.title = 'Valid Title';
    component.newsData.content = 'Valid Content goes here and its long enough';
    
    component.onPublish();
    tick();

    expect(mockNewsService.saveNews).toHaveBeenCalled();
    expect(mockNavCtrl.navigateRoot).toHaveBeenCalledWith('/manage-news');
  }));

  it('should block save if no changes in edit mode', fakeAsync(() => {
    fixture.detectChanges();
    // No changes applied
    component.onPublish();
    tick();
    
    expect(mockToastService.showError).toHaveBeenCalled(); // Because 'warning' maps to showError implicitly or we just check if it was called
    expect(mockNewsService.saveNews).not.toHaveBeenCalled();
  }));
});
