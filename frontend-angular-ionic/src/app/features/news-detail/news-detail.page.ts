import { Component, Input, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, AlertController, ToastController, NavController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { NewsService, NewsItem } from 'src/app/core/services/news.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowBackOutline, newspaperOutline, homeOutline, createOutline, trashOutline, checkmarkCircleOutline } from 'ionicons/icons';
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
  public layoutService = inject(LayoutService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

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
    // El Layout se configurará dinámicamente en loadData al recibir los datos
  }
  constructor() {
    addIcons({ alertCircleOutline, arrowBackOutline, newspaperOutline, homeOutline, createOutline, trashOutline, checkmarkCircleOutline });
    this.isAdmin = this.authService.isAdmin();
  }

  private loadData(id: string) {
    this.isLoading = true;

    // Llamada 1: Detalle por ID (Izquierda)
    this.newsService.getNewsById(id).subscribe({
      next: (data) => {
        this.selectedNew = data;

        // ACTUALIZAR TÍTULO DE CABECERA
        if (data) {
          this.layoutService.setHeader({
            title: 'Detalle de la noticia',
            subtitle: 'Aquí podrás leer la noticia completa.',
            showHero: true
          });

          this.layoutService.setBreadcrumbs([
            { label: '', url: '/home', icon: 'home-outline' },
            { label: 'Noticias', url: '/news' },
            { label: "Detalle" }
          ]);
        }

        // Si no tenemos la lista lateral cargada, la pedimos
        if (this.newsList.length === 0) {
          this.loadSidebarList();
          this.isLoading = false;
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        if (this.newsList.length === 0) this.loadSidebarList();
      }
    });
  }

  private loadSidebarList() {
    // Llamada 2: Noticias Destacadas (Derecha) - Se llama solo una vez
    this.newsService.getFeatured().subscribe({
      next: (news) => {
        this.newsList = news;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }


  @ViewChild(IonContent) content!: IonContent;

  selectNews(news: NewsItem) {
    if (!news.id) return;

    // 1. Cambiamos la URL (por si el usuario refresca)
    this.router.navigate(['/news', news.id]);

    // 2. Cargamos los datos de la nueva noticia inmediatamente
    this.loadData(news.id);

    // 3. Subimos al principio (estilo nativo Ionic)
    if (this.content) {
      this.content.scrollToTop(500);
    }
  }


  // --- ACCIONES DE ADMINISTRADOR ---

  editNews() {
    if (this.selectedNew) {
      this.router.navigate(['/edit-news', this.selectedNew.id]);
    }
  }

  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar noticia?',
      message: 'Esta acción no se puede deshacer. ¿Estás seguro?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteNews();
          }
        }
      ]
    });

    await alert.present();
  }

  private deleteNews() {
    if (!this.selectedNew || !this.selectedNew.id) return;

    this.newsService.deleteNews(this.selectedNew.id).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: '¡Noticia eliminada con éxito!',
          duration: 2000,
          position: 'top',
          cssClass: 'toast-success',
          icon: 'checkmark-circle-outline',
          buttons: [{ role: 'cancel' }]
        });
        toast.present();

        this.router.navigate(['/news']);
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: 'Error al eliminar la noticia',
          duration: 4000,
          position: 'top',
          cssClass: 'toast-error',
          icon: 'alert-circle-outline',
          buttons: [{ role: 'cancel' }]
        });
        toast.present();
      }
    });
  }
}
