import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { PlayersPage } from './players.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayerService } from 'src/app/core/services/player.service';
import { of } from 'rxjs';

describe('PlayersPage', () => {
  let component: PlayersPage;
  let fixture: ComponentFixture<PlayersPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        PlayersPage,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: PlayerService,
          useValue: {
            getPlayers: () => of([]),
            deletePlayer: () => of(null)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load players on init', () => {
    spyOn(component, 'loadPlayers').and.callThrough();
    component.ngOnInit();
    expect(component.loadPlayers).toHaveBeenCalled();
  });
});
