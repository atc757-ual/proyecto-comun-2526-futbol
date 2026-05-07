import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, cameraOutline, sendOutline, arrowBackOutline } from 'ionicons/icons';
import { NewsService, NewsItem } from '../../../core/services/news.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-add-news',
  templateUrl: './add-news.page.html',
  styleUrls: ['./add-news.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddNewsPage implements OnInit {
  private newsService = inject(NewsService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private navCtrl = inject(NavController);

  newsData: NewsItem = {
    title: '',
    summary: '',
    category: 'General',
    author: '',
    content: '',
    imageUrl: '',
    date: new Date().toISOString(),
    tags: [],
    isActive: true
  };

  tagInput: string = '';
  previewImage: string | null = null;
  isPublishing: boolean = false;

  constructor() {
    addIcons({ cloudUploadOutline, cameraOutline, sendOutline, arrowBackOutline });
  }

  ngOnInit() {
    // Establecer autor por defecto desde el usuario logueado
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      this.newsData.author = userData.name || userData.email;
    } else {
      this.newsData.author = 'Admin';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result;
        // En una app real, aquí subiríamos a Firebase Storage y obtendríamos la URL
        // Por ahora simulamos guardando el base64 como URL si es corto, 
        // o usando una imagen de placeholder para que CORBA no pete por tamaño si fuera el caso
        this.newsData.imageUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'; // Placeholder premium
      };
      reader.readAsDataURL(file);
    }
  }

  updateTags() {
    if (this.tagInput) {
      this.newsData.tags = this.tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    } else {
      this.newsData.tags = [];
    }
  }

  async onPublish() {
    if (!this.newsData.title || !this.newsData.content) {
      this.showToast('Por favor, completa los campos obligatorios', 'warning');
      return;
    }

    this.isPublishing = true;
    const loading = await this.loadingCtrl.create({
      message: 'Enviando noticia a CORBA...',
      mode: 'ios'
    });
    await loading.present();

    this.newsService.addNews(this.newsData).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.isPublishing = false;
        this.showToast('¡Noticia publicada con éxito en CORBA!', 'success');
        this.navCtrl.navigateRoot('/news');
      },
      error: async (err) => {
        await loading.dismiss();
        this.isPublishing = false;
        console.error('Error al publicar:', err);
        this.showToast('Error al conectar con el servidor CORBA', 'danger');
      }
    });
  }

  onCancel() {
    this.navCtrl.back();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      mode: 'ios'
    });
    await toast.present();
  }
}
