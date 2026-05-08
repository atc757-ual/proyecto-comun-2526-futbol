import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController, LoadingController, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline, cameraOutline, sendOutline, arrowBackOutline,
  homeOutline, newspaperOutline, listOutline, personOutline, pricetagsOutline,
  fingerPrintOutline, calendarOutline, eyeOutline, eyeOffOutline, closeCircle
} from 'ionicons/icons';
import { NewsService, NewsItem } from '../../../core/services/news.service';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-add-edit-news',
  templateUrl: './add-edit-news.page.html',
  styleUrls: ['./add-edit-news.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddEditNewsPage implements OnInit {
  private newsService = inject(NewsService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);
  private layoutService = inject(LayoutService);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  newsId: string | null = null;
  isLoading = false;

  newsData: NewsItem = {
    title: '',
    summary: '',
    category: 'General',
    author: '',
    content: '',
    imageUrl: '',
    date: new Date().toISOString(),
    tags: [],
    isActive: false
  }

  tagInput: string = '';
  previewImage: string | null = null;
  isPublishing: boolean = false;
  categories = [
    { value: 'Fichajes', label: 'Fichajes' },
    { value: 'Resultados', label: 'Resultados' },
    { value: 'Crónica', label: 'Crónica' },
    { value: 'Opinión', label: 'Opinión' },
    { value: 'Internacional', label: 'Internacional' },
    { value: 'General', label: 'General' }
  ];

  // Estados de foco para los iconos (Estilo Auth)
  focusedField: string | null = null;

  setFocus(field: string | null) {
    this.focusedField = field;
  }

  // Formateador de contador que ignora espacios en blanco
  customCounterFormatter = (inputLength: number, maxLength: number) => {
    // Nota: Aunque Ionic nos pasa inputLength, nosotros calculamos el real sin espacios
    // Necesitamos acceder al valor actual del modelo
    return ``; // Se completará en el HTML o con una lógica más directa
  };

  getNonWhitespaceLength(value: string | undefined): number {
    if (!value) return 0;
    return value.replace(/\s/g, '').length;
  }

  // Formateadores específicos para cada campo para asegurar el contexto
  // Formateador específico para el título que SÍ cuenta espacios
  titleCounterFormatter = (inputLength: number, maxLength: number) => {
    return `${inputLength} / ${maxLength}`;
  };

  summaryCounterFormatter = (inputLength: number, maxLength: number) => {
    const len = this.getNonWhitespaceLength(this.newsData.summary);
    return `${len} / ${maxLength}`;
  };

  contentCounterFormatter = (inputLength: number, maxLength: number) => {
    const len = this.getNonWhitespaceLength(this.newsData.content);
    return `${len} / ${maxLength}`;
  };

  constructor() {
    addIcons({
      cloudUploadOutline, cameraOutline, sendOutline, arrowBackOutline,
      homeOutline, newspaperOutline, listOutline, personOutline, pricetagsOutline,
      fingerPrintOutline, calendarOutline, eyeOutline, eyeOffOutline, closeCircle
    });
  }

  ngOnInit() {
    this.newsId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.newsId;

    this.layoutService.setHeader({
      title: this.isEditMode ? 'Editar noticia' : 'Crear noticia',
      subtitle: this.isEditMode ? 'Actualiza la información de la noticia seleccionada' : '¡Carga Noticias desde aquí, para la comunidad futbolística!',
      showHero: true
    });

    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Noticias', url: '/news' },
      { label: this.isEditMode ? 'Editar noticia' : 'Nueva noticia' }
    ]);

    if (this.isEditMode && this.newsId) {
      this.loadNews();
    } else {
      // Establecer autor por defecto desde el usuario logueado (solo si es nueva)
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        this.newsData.author = userData.name || userData.email;
      } else {
        this.newsData.author = 'Admin';
      }
    }
  }

  loadNews() {
    if (!this.newsId) return;
    this.isLoading = true;
    this.newsService.getNewsById(this.newsId).subscribe({
      next: (news) => {
        this.newsData = { ...news };
        this.previewImage = news.imageUrl;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast('Error al cargar la noticia', 'danger');
        this.navCtrl.navigateBack('/manage-news');
      }
    });
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

  addTag() {
    const tag = this.tagInput.trim().replace(/,/g, '');
    if (tag && !this.newsData.tags.includes(tag)) {
      if (this.newsData.tags.length < 6) {
        this.newsData.tags.push(tag);
        this.tagInput = ''; // Limpiar el input
      } else {
        this.showToast('Máximo 6 etiquetas permitidas', 'warning');
      }
    } else {
      this.tagInput = ''; // Limpiar si está vacío o duplicado
    }
  }

  removeTag(tag: string) {
    this.newsData.tags = this.newsData.tags.filter(t => t !== tag);
  }

  updateTags() {
    if (this.tagInput.includes(',')) {
      this.addTag();
    }
  }

  async onPublish() {
    if (!this.newsData.title || !this.newsData.content) {
      this.showToast('Por favor, completa los campos obligatorios', 'warning');
      return;
    }

    this.isPublishing = true;

    const request = this.isEditMode 
      ? this.newsService.updateNews(this.newsData)
      : this.newsService.addNews(this.newsData);

    request.subscribe({
      next: (res) => {
        this.isPublishing = false;
        const msg = this.isEditMode ? '¡Noticia actualizada con éxito!' : '¡Noticia publicada con éxito en CORBA!';
        this.showToast(msg, 'success');
        this.navCtrl.navigateRoot('/manage-news');
      },
      error: (err) => {
        this.isPublishing = false;
        console.error('Error al procesar la noticia:', err);
        this.showToast('Error al conectar con el servidor CORBA', 'danger');
      }
    });
  }

  onCancel() {
    this.navCtrl.navigateBack('/news');
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
