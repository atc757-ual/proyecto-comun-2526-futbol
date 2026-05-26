import { Component, Input, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent, AlertController, NavController, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { ConfirmModalComponent } from 'src/app/shared/components/modals/confirm-modal/confirm-modal.component';
import { NewsItem } from 'src/app/core/models/news.model';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowBackOutline, newspaperOutline, eyeOutline, eyeOffOutline, homeOutline, addCircleOutline, createOutline, trashOutline, checkmarkCircleOutline, cloudDoneOutline, cloudOfflineOutline } from 'ionicons/icons';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { StorageService } from 'src/app/core/services/system/storage.service';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { ToastService } from 'src/app/core/services/ui/toast.service';
import { PageFullContentComponent } from '../../../shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from '../../../shared/components/layout/layout-elements/page-footer/page-footer.component';

@Component({
  selector: 'app-news-detail',
  templateUrl: './news-detail.page.html',
  styleUrls: ['./news-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, PageFullContentComponent, PageFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewsDetailPage {
  private newsService = inject(NEWS_SERVICE_TOKEN);
  private authService = inject(AuthService);
  private router = inject(Router);
  public platformService = inject(PlatformService); // Aseguramos que sea public
  public layoutService = inject(LayoutService);
  private alertCtrl = inject(AlertController);
  private toastService = inject(ToastService);
  private navCtrl = inject(NavController);
  private modalCtrl = inject(ModalController);
  private storageService = inject(StorageService);

  selectedNew: NewsItem | null = null;
  newsList: NewsItem[] = [];
  isLoading = true;
  isAdmin = false;

  public pageTitle = 'Detalle de la noticia';
  public pageSubtitle = 'Aquí podrás leer la noticia completa.';
  public breadcrumbs: any[] = [];

  @Input() set id(value: string) {
    if (value) {
      this.loadData(value);
    }
  }

  constructor() {
    addIcons({
      alertCircleOutline, arrowBackOutline, addCircleOutline,
      eyeOutline, eyeOffOutline, newspaperOutline, homeOutline, createOutline, trashOutline, checkmarkCircleOutline,
      cloudDoneOutline, cloudOfflineOutline
    });
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
        this.pageTitle = 'Detalle de la noticia';
        this.pageSubtitle = 'Aquí podrás leer la noticia completa.';
        this.breadcrumbs = [
          { label: '', url: '/home', icon: 'home-outline' },
          { label: 'Noticias', url: '/news' },
          { label: "Detalle" }
        ];

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

  showToast(message: string, color: string, icon: string) {
    if (color === 'success') {
      this.toastService.showSuccess(message);
    } else {
      this.toastService.showError(message);
    }
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


  getCategoryColor(category: string): string {
    if (!category) return 'rgba(0,0,0,0.7)';
    const cat = category.toLowerCase();
    if (cat.includes('internacional')) return 'var(--color-primary)';
    if (cat.includes('fichajes')) return 'var(--color-warning)';
    if (cat.includes('crónica') || cat.includes('cronica')) return 'var(--color-tertiary)';
    if (cat.includes('táctica') || cat.includes('tactica')) return 'var(--color-success)';
    if (cat.includes('opinión') || cat.includes('opinion')) return 'var(--color-secondary)';
    return 'rgba(0,0,0,0.7)';
  }

  // --- ACCIONES DE ADMINISTRADOR ---
  isUpdatingStatus = false;

  toggleVisibility() {
    if (!this.selectedNew || this.isUpdatingStatus) return;

    this.isUpdatingStatus = true;
    const updatedStatus = !this.selectedNew.isActive;

    // Clonamos la noticia y cambiamos el estado
    const updatedNews: NewsItem = {
      ...this.selectedNew,
      isActive: updatedStatus
    };

    // Llamamos al servicio (saveNews maneja el update si hay ID)
    this.newsService.updateNews(updatedNews).subscribe({
      next: () => {
        if (this.selectedNew) this.selectedNew.isActive = updatedStatus;
        this.isUpdatingStatus = false;

        const message = updatedStatus ? '¡Noticia publicada con éxito!' : 'Noticia movida a borradores';
        const icon = updatedStatus ? 'cloud-done-outline' : 'cloud-offline-outline';
        const color = updatedStatus ? 'success' : 'medium';

        this.showToast(message, color, icon);
      },
      error: () => {
        this.isUpdatingStatus = false;
        this.showToast('Error al actualizar el estado', 'danger', 'alert-circle-outline');
      }
    });
  }

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
        this.toastService.showSuccess('¡Noticia eliminada con éxito!');
        this.router.navigate(['/news']);
      },
      error: async () => {
        this.toastService.showError('Error al eliminar la noticia');
      }
    });
  }

  trackByNewsId(_: number, news: NewsItem): string | undefined {
    return news._id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}

