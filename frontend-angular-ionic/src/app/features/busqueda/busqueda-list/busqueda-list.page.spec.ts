import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { BusquedaListPage } from './busqueda-list.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayerService } from 'src/app/core/services/player.service';
import { of } from 'rxjs';

describe('BusquedaListPage', () => {
  let component: BusquedaListPage;
  let fixture: ComponentFixture<BusquedaListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        BusquedaListPage,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: PlayerService,
          useValue: {
            searchTSDBLeagues: () => of([]),
            getTSDBTeamsByLeague: () => of([]),
            getTSDBPlayersByTeam: () => of([])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty selection', () => {
    expect(component.selectedPlayers.size).toBe(0);
  });
});
