import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { PlayersPage } from './players.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { PLAYER_SERVICE_TOKEN } from '../../../core/services/players/player.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from '../../../core/services/ui/layout.service';
import { ToastService } from '../../../core/services/ui/toast.service';

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
          provide: PLAYER_SERVICE_TOKEN,
          useValue: {
            getPlayers: () => of([]),
            deletePlayer: () => of(null)
          }
        },
        {
          provide: AuthService,
          useValue: {
            isAdmin: () => false,
            currentUser: () => null
          }
        },
        {
          provide: LayoutService,
          useValue: {
            setHeader: () => {},
            setBreadcrumbs: () => {}
          }
        },
        { provide: ModalController, useValue: {} },
        {
          provide: ToastService,
          useValue: {
            showSuccess: () => Promise.resolve(),
            showError: () => Promise.resolve()
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
