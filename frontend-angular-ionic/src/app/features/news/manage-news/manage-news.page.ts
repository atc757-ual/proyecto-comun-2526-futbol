import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonItem, IonLabel, IonThumbnail,
  IonIcon, IonButton, IonSkeletonText, IonSearchbar,
  ToastController, IonCardTitle,
  NavController, IonCard, IonCardContent, ModalController, IonCardHeader
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline, trashOutline, eyeOutline,
  newspaperOutline, alertCircleOutline, searchOutline,
  chevronBackOutline, chevronForwardOutline, closeCircleOutline,
  checkmarkCircleOutline, calendarClearOutline, addCircleOutline,
  closeCircle
} from 'ionicons/icons';
import { NewsService, NewsItem } from '../../../core/services/news.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from 'src/app/core/services/layout.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-news',
  templateUrl: './manage-news.page.html',
  styleUrls: ['./manage-news.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonItem,
    IonLabel, IonThumbnail, IonIcon, IonButton,
    IonSkeletonText, IonSearchbar,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle
  ]
})
export class ManageNewsPage implements OnInit {
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

  private storageService = inject(StorageService);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);

  constructor(
    private newsService: NewsService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({
      createOutline, trashOutline, eyeOutline,
      newspaperOutline, alertCircleOutline, searchOutline,
      chevronBackOutline, chevronForwardOutline, closeCircleOutline,
      checkmarkCircleOutline, calendarClearOutline, addCircleOutline,
      closeCircle
    });
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    this.loadNews();
    this.layoutService.setHeader({
      title: 'Gestión de noticias',
      subtitle: '¡Gestiona las noticias desde aquí, visualiza, edita y elimina!',
      showHero: true
    });
    this.layoutService.setBreadcrumbs([
      { label: '', url: '', icon: 'home-outline' },
      { label: 'Noticias', url: '/news' },
      { label: 'Gestión de noticias' }
    ]);

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

  async showToast(message: string, color: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: color,
      cssClass: 'premium-toast',
      buttons: [{ icon: icon, side: 'start', handler: () => { } }]
    });
    toast.present();
  }
}


