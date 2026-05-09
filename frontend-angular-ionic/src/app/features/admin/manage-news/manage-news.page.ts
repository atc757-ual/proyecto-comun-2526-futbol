import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonMenuButton, IonList, IonItem, IonLabel, IonThumbnail, 
  IonBadge, IonIcon, IonButton, IonSkeletonText, IonSearchbar,
  IonRefresher, IonRefresherContent, AlertController, ToastController,
  IonMenuToggle, IonRefresherContent as IonRefresherContentComponent, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  createOutline, trashOutline, eyeOutline, 
  newspaperOutline, alertCircleOutline, searchOutline 
} from 'ionicons/icons';
import { NewsService, NewsItem } from '../../../core/services/news.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-manage-news',
  templateUrl: './manage-news.page.html',
  styleUrls: ['./manage-news.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, 
    IonToolbar, IonButtons, IonMenuButton, IonList, IonItem, 
    IonLabel, IonThumbnail, IonBadge, IonIcon, IonButton, 
    IonSkeletonText, IonSearchbar, IonRefresher, IonRefresherContent
  ]
})
export class ManageNewsPage implements OnInit {
  news: NewsItem[] = [];
  filteredNews: NewsItem[] = [];
  isLoading = true;
  searchTerm = '';

  private storageService = inject(StorageService);
  private authService = inject(AuthService);

  constructor(
    private newsService: NewsService,
    private alertController: AlertController,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({ 
      createOutline, trashOutline, eyeOutline, 
      newspaperOutline, alertCircleOutline, searchOutline 
    });
  }

  ngOnInit() {
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
      error: async (err) => {
        console.error('Error cargando noticias:', err);
        this.isLoading = false;
        if (event) event.target.complete();
        const toast = await this.toastController.create({
          message: 'Error al conectar con el servidor CORBA',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        toast.present();
      }
    });
  }

  applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredNews = [...this.news];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredNews = this.news.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.author.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }
  }

  handleRefresh(event: any) {
    this.loadNews(event);
  }

  async deleteNews(item: NewsItem) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la noticia "${item.title}"?`,
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
            this.confirmDelete(item);
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmDelete(item: NewsItem) {
    // Validación de seguridad extra: Solo admin puede borrar
    if (!this.authService.isAdmin()) {
      const toast = await this.toastController.create({
        message: 'No tienes permisos para ejecutar esta acción',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      toast.present();
      return;
    }

    // 1. Si tiene imagen en Firebase Storage, borrarla primero
    if (item.imageUrl && item.imageUrl.includes('firebasestorage')) {
      console.log('[DELETE] Eliminando imagen de Storage antes de borrar noticia...');
      await this.storageService.deleteImageByUrl(item.imageUrl);
    }

    // 2. Borrar de CORBA
    this.newsService.deleteNews(item.id!).subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: 'Noticia eliminada correctamente',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        toast.present();
        this.loadNews();
      },
      error: async (err) => {
        const toast = await this.toastController.create({
          message: 'Error al eliminar la noticia',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        toast.present();
      }
    });
  }

  editNews(item: NewsItem) {
    this.navCtrl.navigateForward(['/edit-news', item.id]);
  }

  viewNews(item: NewsItem) {
    this.navCtrl.navigateForward(['/news', item.id]);
  }
}
