import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  home,
  people,
  sparkles,
  cart,
  newspaper,
  menuOutline,
  football,
  personCircleOutline,
  logOutOutline,
  logoLinkedin,
  logoGithub,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class MainLayoutComponent implements OnInit {
  @Input() title: string = 'mainSystem';

  public appPages = [
    { title: 'Inicio', url: '/home', icon: 'home' },
    { title: 'Jugadores', url: '/players', icon: 'people' },
    { title: 'IA', url: '/ai-team', icon: 'sparkles' },
    { title: 'Mercado', url: '/player-add', icon: 'cart' },
    { title: 'Noticias', url: '/news', icon: 'newspaper' }
  ];

  constructor() {
    addIcons({
      home,
      people,
      cart,
      newspaper,
      menuOutline,
      football,
      personCircleOutline,
      logOutOutline,
      sparkles,
      logoLinkedin,
      logoGithub,
      closeOutline
    });
  }

  ngOnInit() { }

  logout() {
    console.log('Cerrando sesión...');
    // Aquí podrías añadir la lógica de navegación al login o borrar el token
  }
}
