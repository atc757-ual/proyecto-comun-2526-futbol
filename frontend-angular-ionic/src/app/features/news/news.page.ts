import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class NewsPage implements OnInit {
  // ... (newsList remains the same)
  newsList = [
    {
      id: 1,
      title: 'El Real Madrid anuncia nuevo fichaje estrella',
      excerpt: 'El club blanco ha cerrado el acuerdo por una cifra récord. El jugador llegará la próxima semana para pasar el reconocimiento médico.',
      content: 'Madrid, España. En una operación relámpago que ha sorprendido a todo el mercado europeo, el Real Madrid ha hecho oficial la contratación de su nuevo galáctico. Según fuentes oficiales del club, el contrato se ha firmado por las próximas seis temporadas. "Estamos ante un jugador que marcará una época", comentaron desde la directiva.',
      author: 'Marca',
      date: 'Hoy, 10:30',
      tags: ['Fichajes', 'Real Madrid', 'LaLiga'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Análisis: El impacto de la IA en los entrenamientos',
      excerpt: 'Los grandes equipos europeos empiezan a utilizar modelos predictivos para prevenir lesiones y optimizar el rendimiento físico.',
      content: 'La inteligencia artificial ya no es ciencia ficción en el fútbol. Equipos como el Liverpool o el Manchester City cuentan con departamentos enteros de analistas de datos que procesan cada movimiento. La prevención de lesiones es el campo donde más se está invirtiendo, logrando reducir las bajas musculares en un 20%.',
      author: 'Mundo Deportivo',
      date: 'Ayer, 18:45',
      tags: ['Tecnología', 'Entrenamientos', 'IA'],
      image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'El VAR ante una nueva polémica en la Champions',
      excerpt: 'Un penalti no pitado en el último minuto desata las críticas de los aficionados y expertos internacionales.',
      content: 'La noche de Champions se vio empañada por una decisión arbitral que dará que hablar durante semanas. A pesar de la revisión en el monitor, el colegiado decidió no señalar la pena máxima, lo que provocó la indignación del equipo visitante. La UEFA ha emitido un comunicado defendiendo la interpretación del árbitro.',
      author: 'AS',
      date: 'Ayer, 22:15',
      tags: ['Champions League', 'VAR', 'Polémica'],
      image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800&auto=format&fit=crop'
    }
  ];

  selectedNews: any;
  isAdmin = true;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const newsId = params['id'];
      if (newsId) {
        const found = this.newsList.find(n => n.id === parseInt(newsId));
        this.selectedNews = found || this.newsList[0];
      } else {
        this.selectedNews = this.newsList[0];
      }
    });
  }

  selectNews(news: any) {
    this.selectedNews = news;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}
