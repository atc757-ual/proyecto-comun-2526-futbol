import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonItem, IonLabel, IonThumbnail,
  IonIcon, IonButton, IonSkeletonText, IonSearchbar, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  NavController, ModalController, IonContent
} from '@ionic/angular/standalone';
import { PageFullContentComponent } from '../../../shared/components/layout/layout-elements/page-full-content/page-full-content.component';
import { PageFooterComponent } from '../../../shared/components/layout/layout-elements/page-footer/page-footer.component';
import { addIcons } from 'ionicons';
import {
  createOutline, trashOutline, eyeOutline,
  newspaperOutline, alertCircleOutline, searchOutline,
  chevronBackOutline, chevronForwardOutline, closeCircleOutline,
  checkmarkCircleOutline, addCircleOutline,
  cloudUploadOutline, chevronDownOutline, chevronUpOutline,
  documentTextOutline, downloadOutline
} from 'ionicons/icons';
import { NewsItem } from '../../../core/models/news.model';
import { StorageService } from '../../../core/services/system/storage.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { ConfirmModalComponent } from '../../../shared/components/modals/confirm-modal/confirm-modal.component';
import { RouterModule } from '@angular/router';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { ToastService } from 'src/app/core/services/ui/toast.service';

@Component({
  selector: 'app-manage-news',
  templateUrl: './manage-news.page.html',
  styleUrls: ['./manage-news.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonItem, IonLabel, IonThumbnail,
    IonIcon, IonButton, IonSkeletonText, IonSearchbar, IonSpinner,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonContent, PageFullContentComponent, PageFooterComponent
  ]
})
export class ManageNewsPage implements OnInit {
  private newsService = inject(NEWS_SERVICE_TOKEN);
  private storageService = inject(StorageService);
  public authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private modalCtrl = inject(ModalController);
  private toastService = inject(ToastService);
  private navCtrl = inject(NavController);

  news: NewsItem[] = [];
  filteredNews: NewsItem[] = [];
  isLoading = true;
  searchTerm = '';
  isAdmin = false;
  // Paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  pagedNews: NewsItem[] = [];

  // Carga Masiva
  showBulkPanel = false;
  isUploadingBulk = false;
  selectedBulkFile: File | null = null;
  bulkFileName = '';

  constructor() {
    addIcons({
      createOutline, trashOutline, eyeOutline,
      newspaperOutline, alertCircleOutline, searchOutline,
      chevronBackOutline, chevronForwardOutline, closeCircleOutline,
      checkmarkCircleOutline, addCircleOutline,
      cloudUploadOutline, chevronDownOutline, chevronUpOutline,
      documentTextOutline, downloadOutline
    });
    this.isAdmin = this.authService.isAdmin();
  }

  public pageTitle = 'Gestión de noticias';
  public pageSubtitle = '¡Gestiona las noticias desde aquí, visualiza, edita y elimina!';
  public breadcrumbs = [
    { label: '', url: '', icon: 'home-outline' },
    { label: 'Noticias', url: '/news' },
    { label: 'Gestión de noticias' }
  ];

  ngOnInit() {
    this.loadNews();
  }

  ionViewWillEnter() {
    this.loadNews();
  }

  loadNews(event?: any) {
    this.isLoading = true;
    this.newsService.getNews().subscribe({
      next: (data) => {
        this.news = data;
        this.applyFilter();
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error al cargar noticias', 'danger', 'alert-circle-outline');
        if (event) event.target.complete();
      }
    });
  }

  applyFilter() {
    let result = [];
    if (!this.searchTerm.trim()) {
      result = [...this.news];
    } else {
      const term = this.searchTerm.toLowerCase();
      result = this.news.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.author.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }

    this.filteredNews = result;
    this.totalPages = Math.ceil(this.filteredNews.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    this.updatePagedNews();
  }

  updatePagedNews() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedNews = this.filteredNews.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedNews();
    }
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  handleRefresh(event: any) {
    this.loadNews(event);
  }

  async deleteNews(item: NewsItem) {
    const modal = await this.modalCtrl.create({
      component: ConfirmModalComponent,
      componentProps: {
        title: '¿Eliminar noticia?',
        message: `Estás a punto de borrar "${item.title}". Esta acción no se puede deshacer.`,
        confirmText: 'Borrar ahora',
        cancelText: 'Cancelar',
        type: 'delete'
      },
      cssClass: 'premium-modal'
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data === true) {
      this.executeDeletion(item);
    }
  }

  private async executeDeletion(item: NewsItem) {
    if (!this.authService.isAdmin()) {
      this.showToast('No tienes permisos para ejecutar esta acción', 'danger', 'alert-circle-outline');
      return;
    }

    if (item.imageUrl && item.imageUrl.includes('firebasestorage')) {
      await this.storageService.deleteImageByUrl(item.imageUrl);
    }

    // 2. Borrar de CORBA
    this.newsService.deleteNews(item.id!).subscribe({
      next: async () => {
        this.showToast('Noticia eliminada correctamente', 'success', 'checkmark-circle-outline');
        this.loadNews();
      },
      error: async (err) => {
        this.showToast('Error al eliminar la noticia', 'danger', 'alert-circle-outline');
      }
    });
  }


  editNews(item: NewsItem) {
    this.navCtrl.navigateForward(['/edit-news', item.id]);
  }

  viewNews(item: NewsItem) {
    this.navCtrl.navigateForward(['/news', item.id]);
  }

  /**
   * Maneja la selección del archivo (Pre-carga)
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedBulkFile = file;
      this.bulkFileName = file.name;
    }
  }

  /**
   * Ejecuta la subida real tras confirmar
   */
  confirmBulkUpload() {
    if (!this.selectedBulkFile) return;

    this.isUploadingBulk = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        let json = JSON.parse(e.target.result);

        // Si no es un array, lo convertimos en uno de un solo elemento para compatibilidad
        if (!Array.isArray(json)) {
          json = [json];
        }

        this.newsService.bulkAddNews(json).subscribe({
          next: () => {
            this.showToast(`¡Éxito! ${json.length} noticias cargadas correctamente.`, 'success', 'checkmark-circle-outline');
            this.isUploadingBulk = false;
            this.showBulkPanel = false;
            this.selectedBulkFile = null;
            this.bulkFileName = '';
            this.loadNews();
          },
          error: (err) => {
            this.isUploadingBulk = false;
            const errorMsg = err.error?.result?.descriptionDetail || err.message || 'Error desconocido';
            this.showToast(`Error: ${errorMsg}`, 'danger', 'alert-circle-outline');
            console.error('[BULK] Error en el servidor:', err);
          }
        });
      } catch (err) {
        this.isUploadingBulk = false;
        this.showToast('El archivo no tiene un formato JSON válido', 'danger', 'close-circle-outline');
      }
    };

    reader.readAsText(this.selectedBulkFile);
  }

  /**
   * Exporta el listado de noticias actual a un archivo JSON
   */
  downloadNews() {
    if (this.news.length === 0) {
      this.showToast('No hay noticias para descargar', 'warning', 'alert-circle-outline');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.news, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "noticias_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    this.showToast('Exportación completada', 'success', 'checkmark-circle-outline');
  }

  showToast(message: string, type: 'success' | 'danger' | 'warning' | 'info', icon: string) {
    if (type === 'success') {
      this.toastService.showSuccess(message);
    } else {
      this.toastService.showError(message);
    }
  }

  trackByNewsId(_: number, news: NewsItem): string | undefined {
    return news._id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}

