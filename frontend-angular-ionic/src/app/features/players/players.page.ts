import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-players',
  templateUrl: './players.page.html',
  styleUrls: ['./players.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PlayersPage implements OnInit {

  players = [
    { name: 'Lionel Messi', position: 'Delantero', team: 'Inter Miami', rating: 91, image: 'https://b.fssta.com/wp-content/uploads/2023/06/messi-1.png' },
    { name: 'Kylian Mbappé', position: 'Delantero', team: 'Real Madrid', rating: 92, image: 'https://b.fssta.com/wp-content/uploads/2022/12/kylian-mbappe-1.png' },
    { name: 'Jude Bellingham', position: 'Mediocampista', team: 'Real Madrid', rating: 88, image: 'https://img.asmedia.epimg.net/resizer/v2/https%3A%2F%2Fas01.epimg.net%2Fimg%2Fcomunes%2Ffotos%2Ffichas%2Fdeportistas%2Fj%2Fjud%2F50125.png?auth=93689668d9047915570889f893d56d782782787878787878787878787878&width=200&height=200' }
  ];

  isAdmin = true;

  constructor() { }

  ngOnInit() { }

  deletePlayer(player: any) {
    console.log('Borrando jugador:', player.name);
  }

}
