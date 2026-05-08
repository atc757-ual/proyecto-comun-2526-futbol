import { Component, Input, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { NewsService, NewsItem } from 'src/app/core/services/news.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowBackOutline, newspaperOutline, homeOutline } from 'ionicons/icons';
import { LayoutService } from 'src/app/core/services/layout.service';
@Component({
  selector: 'app-news-detail',
  templateUrl: './news-detail.page.html',
  styleUrls: ['./news-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewsDetailPage {
  private newsService = inject(NewsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public platformService = inject(PlatformService); // Aseguramos que sea public
  public layoutService = inject(LayoutService); // Inyectamos LayoutService

  selectedNew: NewsItem | null = null;
  newsList: NewsItem[] = [];
  isLoading = true;
  isAdmin = false;

  @Input() set id(value: string) {
    if (value) {
      this.loadData(value);
    }
  }

  async ngOnInit() {
    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Noticias', url: '/news' },
      { label: 'Detalle noticias' }
    ]);
  }
  constructor() {
    addIcons({ alertCircleOutline, arrowBackOutline, newspaperOutline, homeOutline });
    this.isAdmin = this.authService.isAdmin();
  }

  private loadData(id: string) {
    this.isLoading = true;

    this.newsService.getNewsById(id).subscribe({
      next: (data) => {
        this.selectedNew = data;
        if (this.newsList.length === 0) {
          this.loadSidebarList();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        this.loadSidebarList();
      }
    });
  }

  private loadSidebarList() {
    this.newsService.getNews().subscribe({
      next: (news) => {
        this.newsList = this.isAdmin ? news : news.filter(n => n.isActive);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }


  selectNews(news: NewsItem) {
    this.router.navigate(['/news', news.id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


}
