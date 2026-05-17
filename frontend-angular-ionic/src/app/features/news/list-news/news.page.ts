import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NewsItem } from '../../../core/models/news.model';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news.service.token';
import { AuthService } from '../../../core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { LayoutService } from 'src/app/core/services/layout.service';
import { addIcons } from 'ionicons';
import { addCircleOutline, newspaperOutline, homeOutline, settingsOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule]
})
export class NewsPage implements OnInit, OnDestroy {
  private newsService = inject(NEWS_SERVICE_TOKEN);
  private authService = inject(AuthService); // Inyectado correctamente aquí
  private route = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  private navCtrl = inject(NavController);

  newsList: NewsItem[] = [];
  featuredNews: NewsItem[] = []; // Nueva lista para el sidebar
  selectedNew: NewsItem | null = null;
  isAdmin = false;
  isLoading = true;
  activeSpotlightIndex = -1; // Empezamos en -1 para que nada tenga foco al cargar
  private spotlightTimer: any;

  // Variables de Paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  totalNews: NewsItem[] = [];
  isChangingPage = false; // Para el efecto de transición

  constructor() {
    addIcons({ addCircleOutline, newspaperOutline, homeOutline, settingsOutline, chevronBackOutline, chevronForwardOutline });
  }

  async ngOnInit() {
    // Configurar Layout
    this.layoutService.setHeader({
      title: 'Noticias de Fútbol',
      subtitle: 'Mantente al día con la actualidad deportiva',
      showHero: true,
      isHome: false
    });

    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Noticias' }
    ]);

    this.isAdmin = this.authService.isAdmin(); // Usamos la instancia inyectada
    this.loadNews();
    this.loadFeatured(); // Carga independiente para el sidebar

    // Si es Desktop, activamos el primer foco inmediatamente
    if (this.platformService.isDesktop) {
      this.activeSpotlightIndex = 0;
    }

    this.startSpotlight();
  }

  ngOnDestroy() {
    if (this.spotlightTimer) {
      clearInterval(this.spotlightTimer);
    }
  }

  startSpotlight() {
    this.spotlightTimer = setInterval(() => {
      // Usamos el getter isDesktop del servicio (si no es desktop, es móvil)
      if (!this.platformService.isDesktop) {
        this.activeSpotlightIndex = -1;
        return;
      }

      const limit = Math.min(this.newsList.length, 6);
      if (limit > 0) {
        this.activeSpotlightIndex = (this.activeSpotlightIndex + 1) % limit;
      }
    }, 3500);
  }

  loadNews() {
    this.isLoading = true;

    this.newsService.getFeed().subscribe({
      next: (news) => {
        // Usamos las noticias reales del servicio
        this.totalNews = news;

        // Calculamos páginas
        this.totalPages = Math.ceil(this.totalNews.length / this.itemsPerPage);

        // Obtenemos solo la primera página para mostrar
        this.updateVisibleNews();

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando noticias:', err);
        this.isLoading = false;
      }
    });
  }

  loadFeatured() {
    this.newsService.getFeatured().subscribe({
      next: (news) => {
        // Mostramos solo las 5 primeras en el sidebar
        this.featuredNews = news.slice(0, 5);
      },
      error: (err) => console.error('Error cargando destacadas:', err)
    });
  }

  updateVisibleNews() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.newsList = this.totalNews.slice(start, end);

    // Al cambiar de página, reiniciamos el foco del spotlight
    this.activeSpotlightIndex = -1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && !this.isChangingPage) {
      this.isChangingPage = true;

      // Esperamos a que la animación de "salida" termine
      setTimeout(() => {
        this.currentPage = page;
        this.updateVisibleNews();
        this.isChangingPage = false;

        // Scroll arriba suave
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  selectNews(news: NewsItem) {
    // Update selected news for UI highlight
    this.selectedNew = news;
    // Navigate to the detail page for the chosen news item
    this.navCtrl.navigateForward(['/news', news.id]);
  }

  goToDetail(id: string | undefined) {
    if (id) {
      this.navCtrl.navigateForward(['/news', id]);
    }
  }
}
