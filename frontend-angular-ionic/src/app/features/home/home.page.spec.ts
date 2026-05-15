import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayerService } from 'src/app/core/services/player.service';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let playerService: PlayerService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        HomePage,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: PlayerService,
          useValue: {
            getTSDBTVBySport: () => of([]),
            getTSDBLiveScores: () => of([]),
            getPlayers: () => of([]),
            getTVByCountry: () => of([])
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    playerService = TestBed.inject(PlayerService);
    fixture.detectChanges();
  }));

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
    expect(event.target.src).toContain('ui-avatars.com');
  });
});
