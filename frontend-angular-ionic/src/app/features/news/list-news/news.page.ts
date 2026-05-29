import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';
import { IonContent } from '@ionic/angular/standalone';
import { PageFullContentComponent } from '../../../shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from '../../../shared/components/layout/layout-elements/page-footer/page-footer.component';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NewsItem } from '../../../core/models/news.model';
import { FALLBACK_NEWS_IMG, hasValidImage } from '../../../core/services/news/news.utils';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { AuthService } from '../../../core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { addIcons } from 'ionicons';
import { addCircleOutline, newspaperOutline, homeOutline, settingsOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule, PageFullContentComponent, PageFooterComponent]
})
export class NewsPage implements OnInit, OnDestroy {
  private readonly newsService = inject(NEWS_SERVICE_TOKEN);
  public authService = inject(AuthService); // Inyectado correctamente aquí
  private readonly route = inject(ActivatedRoute);
  private readonly loadingCtrl = inject(LoadingController);
  public platformService = inject(PlatformService);
  public layoutService = inject(LayoutService);
  private readonly navCtrl = inject(NavController);
  private readonly toastService = inject(ToastService);

  readonly FALLBACK_NEWS_IMG = FALLBACK_NEWS_IMG;
  hasValidImage = hasValidImage;

  newsList: NewsItem[] = [];
  featuredNews: NewsItem[] = []; // Nueva lista para el sidebar
  selectedNew: NewsItem | null = null;
  isAdmin = false;
  isLoading = true;
  activeSpotlightIndex = -1; // Empezamos en -1 para que nada tenga foco al cargar
  private readonly destroy$ = new Subject<void>();
  private spotlightTimer: ReturnType<typeof setInterval> | null = null;

  // Variables de Paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  totalNews: NewsItem[] = [];
  isChangingPage = false; // Para el efecto de transición

  constructor() {
    addIcons({ addCircleOutline, newspaperOutline, homeOutline, settingsOutline, chevronBackOutline, chevronForwardOutline });
  }

  public pageTitle = 'Noticias de Fútbol';
  public pageSubtitle = 'Mantente al día con la actualidad deportiva';
  public breadcrumbs = [
    { label: '', url: '/home', icon: 'home-outline' },
    { label: 'Noticias' }
  ];

  ionViewWillEnter() {
    this.isAdmin = this.authService.isAdmin();
    this.loadNews();
    this.loadFeatured();
  }

  async ngOnInit() {

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
    this.destroy$.next();
    this.destroy$.complete();
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

    this.newsService.getFeed().pipe(takeUntil(this.destroy$)).subscribe({
      next: (news) => {
        // Usamos las noticias reales del servicio
        this.totalNews = news;

        // Calculamos páginas
        this.totalPages = Math.ceil(this.totalNews.length / this.itemsPerPage);

        // Obtenemos solo la primera página para mostrar
        this.updateVisibleNews();

        this.isLoading = false;
      },
      error: () => {
        this.toastService.showError('Error cargando las noticias');
        this.isLoading = false;
      }
    });
  }

  loadFeatured() {
    this.newsService.getFeatured().pipe(takeUntil(this.destroy$)).subscribe({
      next: (news) => {
        this.featuredNews = news.slice(0, 5);
      },
      error: () => this.toastService.showError('Error cargando noticias destacadas')
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

  trackByNewsId(index: number, news: NewsItem): string | number {
    return news.id || index;
  }

  trackByPage(index: number, page: number): number {
    return page;
  }
}

