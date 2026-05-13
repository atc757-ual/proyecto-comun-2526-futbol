import { Component, Input, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, AlertController, ToastController, NavController, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { ConfirmModalComponent } from 'src/app/shared/components/confirm-modal/confirm-modal.component';
import { NewsService, NewsItem } from 'src/app/core/services/news.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { PlatformService } from 'src/app/core/services/platform.service';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowBackOutline, newspaperOutline, homeOutline, addCircleOutline, createOutline, trashOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { LayoutService } from 'src/app/core/services/layout.service';
import { StorageService } from 'src/app/core/services/storage.service';
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
  private modalCtrl = inject(ModalController);
  private storageService = inject(StorageService);

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
    addIcons({ alertCircleOutline, arrowBackOutline, addCircleOutline, newspaperOutline, homeOutline, createOutline, trashOutline, checkmarkCircleOutline });
    this.isAdmin = this.authService.isAdmin();
  }

  private loadData(id: string) {
    this.isLoading = true;

    // Llamada 1: Detalle por ID (Con soporte de Caché Local)
    this.newsService.getNewsById(id).subscribe({
      next: (data) => {
        if (!data) {
          this.isLoading = false;
          this.showToast('No se encontró la noticia solicitada', 'warning', 'alert-circle-outline');
          this.navCtrl.navigateBack('/news');
          return;
        }

        this.selectedNew = data;

        // ACTUALIZAR TÍTULO DE CABECERA
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

        // Si no tenemos la lista lateral cargada, la pedimos
        if (this.newsList.length === 0) {
          this.loadSidebarList();
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error de conexión. Intentando cargar modo offline...', 'danger', 'alert-circle-outline');
        if (this.newsList.length === 0) this.loadSidebarList();
      }
    });
  }

  async showToast(message: string, color: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: color,
      buttons: [{ icon: icon, side: 'start', handler: () => { } }]
    });
    toast.present();
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
    if (!this.selectedNew) return;

    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: '¿Eliminar noticia?',
        message: `Estás a punto de borrar "${this.selectedNew.title}". Esta acción no se puede deshacer.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        type: 'delete'
      },
      cssClass: 'premium-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data === true) {
      this.deleteNews();
    }
  }

  private async deleteNews() {
    if (!this.selectedNew || !this.selectedNew.id) return;

    // 1. Borrar imagen de Storage (si existe y es de Firebase)
    if (this.selectedNew.imageUrl && this.selectedNew.imageUrl.includes('firebasestorage')) {
      await this.storageService.deleteImageByUrl(this.selectedNew.imageUrl);
    }

    // 2. Borrar registro de CORBA
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
