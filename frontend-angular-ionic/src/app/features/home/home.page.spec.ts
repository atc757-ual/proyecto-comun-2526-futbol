import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Platform } from '@ionic/angular/standalone';
import { HomePage } from './home.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PLAYER_SERVICE_TOKEN } from 'src/app/core/services/players/player.service.token';
import { NEWS_SERVICE_TOKEN } from 'src/app/core/services/news/news.service.token';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { Auth } from '@angular/fire/auth';
import { ToastController, AlertController, ModalController } from '@ionic/angular/standalone';
import { ToastService } from 'src/app/core/services/ui/toast.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let playerService: any;

  beforeEach(async () => {
    const modalSpy = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onWillDismiss']);
    modalSpy.onWillDismiss.and.returnValue(Promise.resolve({ data: true }));
    const modalCtrlMock = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlMock.create.and.returnValue(Promise.resolve(modalSpy));

    const alertSpy = jasmine.createSpyObj('HTMLIonAlertElement', ['present', 'onWillDismiss']);
    const alertCtrlMock = jasmine.createSpyObj('AlertController', ['create']);
    alertCtrlMock.create.and.returnValue(Promise.resolve(alertSpy));

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        HomePage,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: PLAYER_SERVICE_TOKEN,
          useValue: {
            getTSDBTVBySport: () => of([]),
            getTSDBLiveScores: () => of([]),
            getPlayers: () => of([]),
            getTVByCountry: () => of([])
          }
        },
        {
          provide: NEWS_SERVICE_TOKEN,
          useValue: {
            getFeatured: () => of([])
          }
        },
        {
          provide: AuthService,
          useValue: {
            firstName: () => 'Test',
            isAdmin: () => false,
            logout: () => Promise.resolve()
          }
        },
        {
          provide: LayoutService,
          useValue: {
            setHeader: () => {},
            setBreadcrumbs: () => {}
          }
        },
        {
          provide: Auth,
          useValue: {}
        },
        {
          provide: Platform,
          useValue: {
            is: () => false,
            backButton: {
              subscribeWithPriority: () => ({ unsubscribe: () => {} })
            }
          }
        },
        { provide: ToastController, useValue: {} },
        { provide: AlertController, useValue: alertCtrlMock },
        { provide: ModalController, useValue: modalCtrlMock },
        {
          provide: ToastService,
          useValue: {
            showSuccess: () => Promise.resolve(),
            showError: () => Promise.resolve()
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    playerService = TestBed.inject(PLAYER_SERVICE_TOKEN);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadTVScheduleByCountry on init', () => {
    spyOn(component, 'loadTVScheduleByCountry').and.callThrough();
    component.ngOnInit();
    expect(component.loadTVScheduleByCountry).toHaveBeenCalled();
  });

  it('should update tvScheduleJson when data is loaded', () => {
    const mockData = [{ id: '1', strEvent: 'Test Match', dateEvent: '2026-05-13' }];
    spyOn(playerService, 'getTVByCountry').and.returnValue(of(mockData));
    
    component.loadTVScheduleByCountry();
    
    expect(component.tvScheduleJson).toBe(JSON.stringify(mockData));
    expect(component.isLoadingSchedule).toBeFalse();
  });

  it('should handle avatar error with fallback', () => {
    const event = { target: { src: '' } };
    component.handleAvatarError(event);
    expect(event.target.src).toContain('data:image/svg+xml');
  });

  it('should navigate to /players when onViewMorePlayers is called', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    component.onViewMorePlayers();
    expect(router.navigate).toHaveBeenCalledWith(['/players']);
  });

  it('should navigate to /player-detail/:id when onPlayerClicked is called', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    const mockEvent = { detail: { _id: '123' } };
    component.onPlayerClicked(mockEvent);
    expect(router.navigate).toHaveBeenCalledWith(['/player-detail', '123']);
  });

  it('should navigate to /news/:id when goToNewsDetail is called', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    const mockNews = { id: 'abc' };
    component.goToNewsDetail(mockNews);
    expect(router.navigate).toHaveBeenCalledWith(['/news', 'abc']);
  });
});
